import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { hashPassword } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { sendEmail, welcomeEmailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, username, email, password } = body

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const normalizedUsername = String(username).trim().toLowerCase()
    if (!/^[a-z0-9_-]{3,30}$/.test(normalizedUsername)) {
      return NextResponse.json({ error: 'Username must be 3–30 characters using only letters, numbers, underscores, or hyphens' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not available. Please try again later.' }, { status: 503 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    })
    if (existing) {
      return NextResponse.json({
        error: existing.username === normalizedUsername
          ? 'This username is already taken'
          : 'An account with this email already exists',
      }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'customer',
    })

    await createNotification({
      type: 'user_registered',
      title: 'New user registered',
      message: `${name} (${email}) just created an account.`,
      link: `/admin/users/${user._id}`,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    sendEmail({
      to: user.email,
      subject: 'Welcome to Jacketee',
      html: welcomeEmailTemplate({ userName: user.name, shopUrl: appUrl }),
    }).then((result) => {
      if (!result.success) console.error('Failed to send welcome email:', result.message)
    })

    const { password: _, ...userWithoutPassword } = user.toObject()
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'This email or username is already in use' }, { status: 409 })
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}