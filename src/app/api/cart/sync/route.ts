import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import AbandonedCart from '@/models/AbandonedCart'

// Called from the client whenever the cart changes so we always have a fresh
// server-side snapshot to work from if the user leaves without checking out.
// Guests (no session) are skipped since we have no email to reach them with,
// and orders themselves already require an authenticated session.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ skipped: true, reason: 'Not authenticated' }, { status: 200 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ skipped: true, reason: 'Database not connected' }, { status: 200 })
    }

    const body = await request.json()
    const { items, subtotal, promoCode } = body

    const userId = (session.user as any).id
    const userEmail = session.user.email || ''
    const userName = session.user.name || ''

    if (!userId || !userEmail) {
      return NextResponse.json({ skipped: true, reason: 'Missing user identity' }, { status: 200 })
    }

    // An empty cart means there is nothing to recover — remove any existing
    // snapshot so we never send a "you left something behind" email for a
    // cart the user already emptied themselves.
    if (!Array.isArray(items) || items.length === 0) {
      await AbandonedCart.deleteOne({ userId })
      return NextResponse.json({ cleared: true })
    }

    const sanitizedItems = items.map((item: any) => ({
      productId: String(item.productId),
      name: String(item.name),
      image: String(item.image),
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      variants: Array.isArray(item.variants) ? item.variants : [],
    }))

    await AbandonedCart.findOneAndUpdate(
      { userId },
      {
        userId,
        userEmail,
        userName,
        items: sanitizedItems,
        subtotal: Number(subtotal) || 0,
        promoCode: promoCode || undefined,
        lastActivityAt: new Date(),
        // Any further activity means the cart is "live" again — reset the
        // recovery/reminder state so a future abandonment starts a fresh cycle.
        recovered: false,
        recoveredAt: undefined,
        remindersSent: [],
        lastReminderAt: undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return NextResponse.json({ synced: true })
  } catch (error: any) {
    console.error('Cart sync error:', error)
    // Never let cart tracking failures break the shopping experience.
    return NextResponse.json({ skipped: true, error: error.message }, { status: 200 })
  }
}
