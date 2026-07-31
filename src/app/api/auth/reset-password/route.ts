import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { hashPassword } from '@/lib/auth'
import { sendEmail, passwordChangedTemplate } from '@/lib/email'

// Validate a reset token (used by the reset-password page before showing the form)
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ valid: false, error: 'Database not available' }, { status: 503 })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      return NextResponse.json({ valid: false, error: 'This reset link is invalid or has expired' }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch (error: any) {
    console.error('Reset token validation error:', error)
    return NextResponse.json({ valid: false, error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const token = body?.token
    const password = body?.password

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not available. Please try again later.' }, { status: 503 })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 })
    }

    user.password = await hashPassword(password)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    sendEmail({
      to: user.email,
      subject: 'Your LUXE STORE password was changed',
      html: passwordChangedTemplate({ userName: user.name }),
    }).then((result) => {
      if (!result.success) console.error('Failed to send password-changed email:', result.message)
    })

    return NextResponse.json({ message: 'Your password has been reset successfully. You can now sign in.' })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 })
  }
}
