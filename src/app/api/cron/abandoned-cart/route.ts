import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import AbandonedCart from '@/models/AbandonedCart'
import { sendEmail, abandonedCartTemplate } from '@/lib/email'

// Staged recovery sequence: how many hours a cart must have sat idle before
// each reminder fires. Index in this array doubles as the "reminder id"
// stored in AbandonedCart.remindersSent so a cart is never emailed twice for
// the same stage even if the cron runs more often than the gaps below.
const REMINDER_STAGES: Array<{ hours: number; stage: 'first' | 'second' | 'final' }> = [
  { hours: 1, stage: 'first' },
  { hours: 24, stage: 'second' },
  { hours: 72, stage: 'final' },
]

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Optional: set ABANDONED_CART_DISCOUNT_CODE in the environment to include an
// incentive code in the final reminder email. Left undefined = no code shown.
const DISCOUNT_CODE = process.env.ABANDONED_CART_DISCOUNT_CODE || undefined

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured — refuse to run rather than exposing an
    // unauthenticated endpoint that can spam customers with emails.
    return false
  }
  const header = request.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : request.headers.get('x-cron-secret')
  return provided === secret
}

export async function GET(request: NextRequest) {
  return runAbandonedCartSweep(request)
}

export async function POST(request: NextRequest) {
  return runAbandonedCartSweep(request)
}

async function runAbandonedCartSweep(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await connectDB()
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
  }

  const now = Date.now()
  const oldestThresholdHours = REMINDER_STAGES[0].hours

  try {
    // Only pull carts that are at least eligible for the earliest stage and
    // haven't already been fully recovered/opted out of the sequence.
    const candidates = await AbandonedCart.find({
      recovered: false,
      lastActivityAt: { $lte: new Date(now - oldestThresholdHours * 60 * 60 * 1000) },
    })

    let emailsSent = 0
    let skipped = 0

    for (const cart of candidates) {
      const idleHours = (now - new Date(cart.lastActivityAt).getTime()) / (60 * 60 * 1000)

      // Find the furthest stage this cart currently qualifies for that
      // hasn't been sent yet (send at most one email per cart per run).
      let stageToSend: { hours: number; stage: 'first' | 'second' | 'final' } | undefined
      for (const candidateStage of REMINDER_STAGES) {
        if (idleHours >= candidateStage.hours && !cart.remindersSent.includes(candidateStage.hours)) {
          stageToSend = candidateStage
        }
      }

      if (!stageToSend) {
        skipped++
        continue
      }

      const { subject, html } = abandonedCartTemplate({
        userName: cart.userName || 'there',
        items: cart.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        subtotal: cart.subtotal,
        cartUrl: `${APP_URL}/checkout`,
        stage: stageToSend.stage,
        discountCode: stageToSend.stage === 'final' ? DISCOUNT_CODE : undefined,
      })

      const result = await sendEmail({
        to: cart.userEmail,
        subject: `Jacketee - ${subject}`,
        html,
      })

      if (result.success) {
        cart.remindersSent = [...cart.remindersSent, stageToSend.hours]
        cart.lastReminderAt = new Date()
        // Once the final stage has been sent, stop tracking this cart —
        // further nudges add no value and the cron shouldn't keep scanning it.
        if (stageToSend.stage === 'final') {
          cart.recovered = true
          cart.recoveredAt = new Date()
        }
        await cart.save()
        emailsSent++
      } else {
        skipped++
      }
    }

    return NextResponse.json({
      scanned: candidates.length,
      emailsSent,
      skipped,
    })
  } catch (error: any) {
    console.error('Abandoned cart cron error:', error)
    return NextResponse.json({ error: 'Failed to run abandoned cart sweep' }, { status: 500 })
  }
}
