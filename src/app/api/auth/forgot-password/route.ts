import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { sendEmail, passwordResetTemplate } from '@/lib/email'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const email = body?.email

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 })
    }

    const genericResponse = NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent a password reset link.',
    })

    const db = await connectDB()
    if (!db) {
      // Do not leak DB availability details to the client for this endpoint
      return genericResponse
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      // Return the same generic response to avoid revealing whether the email is registered
      return genericResponse
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await user.save()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Reset your LUXE STORE password',
      html: passwordResetTemplate({ userName: user.name, resetUrl }),
    })

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.message)
    }

    return genericResponse
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 })
  }
}
