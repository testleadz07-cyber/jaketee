import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Subscriber from '@/models/Subscriber'
import { createNotification } from '@/lib/notifications'
import { newsletterSubscriptionTemplate, sendEmail } from '@/lib/email'
import { requireTurnstile } from '@/lib/turnstile'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const NEWSLETTER_DISCOUNT_CODE = 'WELCOME15'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const denied = await requireTurnstile(body?.turnstileToken, 'newsletter')
    if (denied) return denied
    const { email } = body

    if (!email || typeof email !== 'string' || email.length > 254) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 })
    }

    const trimmedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const db = await connectDB()
    if (db) {
      const existing = await Subscriber.findOne({ email: trimmedEmail })
      let subscriber
      if (existing) {
        // A retry only sends the previously failed welcome email, not another subscription.
        subscriber = await Subscriber.findOneAndUpdate({
          _id: existing._id,
          welcomeEmailStatus: 'failed',
          welcomeEmailAttemptAt: { $lt: new Date(Date.now() - 60_000) },
        }, { $set: { welcomeEmailStatus: 'pending', welcomeEmailAttemptAt: new Date() } }, { returnDocument: 'after' })
        if (!subscriber) {
          return NextResponse.json({ error: 'Already subscribed. If a welcome email recently failed, wait a minute before retrying.' }, { status: 409 })
        }
      } else {
        subscriber = await Subscriber.create({ email: trimmedEmail, welcomeEmailStatus: 'pending', welcomeEmailAttemptAt: new Date() })
      }

      if (!existing) await createNotification({ type: 'newsletter_signup', title: 'New newsletter subscriber', message: trimmedEmail }).catch(() => console.error('Newsletter admin notification failed'))
      const emailResult = await sendEmail({
        to: trimmedEmail,
        subject: 'Welcome to Jacketee - You are subscribed',
        html: newsletterSubscriptionTemplate({ shopUrl: APP_URL, discountCode: NEWSLETTER_DISCOUNT_CODE }),
      }).catch(() => ({ success: false }))
      await Subscriber.updateOne({ _id: subscriber._id }, { $set: { welcomeEmailStatus: emailResult.success ? 'accepted' : 'failed' } }).catch(() => console.error('Newsletter email status could not be saved'))
      return NextResponse.json({
        subscribed: true,
        emailStatus: emailResult.success ? 'accepted' : 'failed',
        message: emailResult.success
          ? 'Subscription saved. Your welcome email was accepted for delivery; check your inbox and spam folder.'
          : 'Subscription saved, but we could not send your welcome email. Retry this email address after a minute to request the welcome email, or contact support; your subscription is already saved.',
      }, { status: 201 })
    }

    return NextResponse.json({ error: 'We could not save your subscription. Please try again later.' }, { status: 503 })
  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ error: 'Failed to subscribe. Please try again later.' }, { status: 500 })
  }
}
