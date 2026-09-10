import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Subscriber from '@/models/Subscriber'
import { createNotification } from '@/lib/notifications'
import { newsletterSubscriptionTemplate, sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const NEWSLETTER_DISCOUNT_CODE = 'WELCOME15'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
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
      if (existing) {
        return NextResponse.json({ error: 'You are already subscribed to our newsletter!' }, { status: 409 })
      }

      await Subscriber.create({ email: trimmedEmail })

      await createNotification({
        type: 'newsletter_signup',
        title: 'New newsletter subscriber',
        message: trimmedEmail,
      })

      const emailResult = await sendEmail({
        to: trimmedEmail,
        subject: 'Welcome to Jacketee - You are subscribed',
        html: newsletterSubscriptionTemplate({
          shopUrl: APP_URL,
          discountCode: NEWSLETTER_DISCOUNT_CODE,
        }),
      })

      if (!emailResult.success) {
        console.error('Newsletter confirmation email failed:', emailResult.message)
      }

      return NextResponse.json({ message: 'Successfully subscribed. Please check your email for your welcome code.' }, { status: 201 })
    }

    // Static/Mock mode success simulation
    console.log('Database not connected. Simulating success response for email subscription:', trimmedEmail)
    if (trimmedEmail === 'test-duplicate@example.com') {
      return NextResponse.json({ error: 'You are already subscribed to our newsletter! (Demo Mode)' }, { status: 409 })
    }

    const emailResult = await sendEmail({
      to: trimmedEmail,
      subject: 'Welcome to Jacketee - You are subscribed',
      html: newsletterSubscriptionTemplate({
        shopUrl: APP_URL,
        discountCode: NEWSLETTER_DISCOUNT_CODE,
      }),
    })

    if (!emailResult.success) {
      console.error('Newsletter confirmation email failed:', emailResult.message)
    }

    return NextResponse.json({ message: 'Successfully subscribed. Please check your email for your welcome code. (Demo Mode)' }, { status: 201 })
  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ error: 'Failed to subscribe. Please try again later.' }, { status: 500 })
  }
}
