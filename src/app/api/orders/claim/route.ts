import crypto from 'crypto'
import mongoose from 'mongoose'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import { guestOrderClaimTemplate, sendEmail } from '@/lib/email'
import GuestOrderClaim from '@/models/GuestOrderClaim'
import Order from '@/models/Order'

const TOKEN_TTL_MS = 30 * 60 * 1000
const MESSAGE = 'If that email has guest orders, a verification link will be sent to it.'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: 'Sign in to claim guest orders' }, { status: 401 })
    }
    const body = await request.json().catch(() => null)
    if (!body || !['request', 'confirm'].includes(body.action)) {
      return NextResponse.json({ error: 'Invalid claim request' }, { status: 400 })
    }
    if (!(await connectDB())) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    if (body.action === 'request') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return NextResponse.json({ error: 'Enter a valid checkout email' }, { status: 400 })
      }
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return NextResponse.json({ error: 'Email verification is unavailable right now' }, { status: 503 })
      }
      const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const guestOrdersExist = await Order.exists({ userId: null, userEmail: new RegExp(`^${escapedEmail}$`, 'i') })
      if (guestOrdersExist) {
        await GuestOrderClaim.deleteMany({ userId, email })
        const token = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        const claim = await GuestOrderClaim.create({
          userId,
          email,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        })
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
        const claimUrl = `${appUrl}/profile/claim-orders?token=${token}`
        const result = await sendEmail({
          to: email,
          subject: 'Link your Jacketee guest orders',
          html: guestOrderClaimTemplate({ claimUrl }),
        })
        if (!result.success) await GuestOrderClaim.deleteOne({ _id: claim._id })
      }
      return NextResponse.json({ message: MESSAGE })
    }

    const token = typeof body.token === 'string' ? body.token : ''
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const claim = await GuestOrderClaim.findOneAndDelete({
      tokenHash,
      userId,
      expiresAt: { $gt: new Date() },
    })
    if (!claim) {
      return NextResponse.json({ error: 'This link has expired or was already used. Request a new link.' }, { status: 400 })
    }
    const escapedEmail = claim.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const result = await Order.updateMany(
      { userId: null, userEmail: new RegExp(`^${escapedEmail}$`, 'i') },
      { $set: { userId } }
    )
    return NextResponse.json({ claimed: result.modifiedCount })
  } catch (error) {
    console.error('Guest order claim failed:', error)
    return NextResponse.json({ error: 'Could not link guest orders. Please try again.' }, { status: 500 })
  }
}
