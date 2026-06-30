import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Subscriber from '@/models/Subscriber'

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
      return NextResponse.json({ message: 'Successfully subscribed to the newsletter!' }, { status: 201 })
    }

    // Static/Mock mode success simulation
    console.log('Database not connected. Simulating success response for email subscription:', trimmedEmail)
    if (trimmedEmail === 'test-duplicate@example.com') {
      return NextResponse.json({ error: 'You are already subscribed to our newsletter! (Demo Mode)' }, { status: 409 })
    }

    return NextResponse.json({ message: 'Successfully subscribed to the newsletter! (Demo Mode)' }, { status: 201 })
  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ error: 'Failed to subscribe. Please try again later.' }, { status: 500 })
  }
}
