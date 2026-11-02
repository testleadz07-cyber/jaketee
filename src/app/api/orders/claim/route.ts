import { checkRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'
import mongoose from 'mongoose'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import { emailConfigurationError, guestOrderClaimTemplate, sendEmail } from '@/lib/email'
import GuestOrderClaim from '@/models/GuestOrderClaim'
import Order from '@/models/Order'

const TOKEN_TTL_MS = 30 * 60 * 1000
const MESSAGE = 'Request processed. If eligible, check your inbox and spam folder for a verification link. If it does not arrive, try again later or contact support.'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: 'Sign in to claim guest orders' }, { status: 401 })
    }
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    const text = await request.text()
    if (text.length > 8192) return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    let body: any
    try { body = JSON.parse(text) } catch { body = null }
    if (!body || !['request', 'confirm'].includes(body.action)) {
      return NextResponse.json({ error: 'Invalid claim request' }, { status: 400 })
    }
    const quota = await checkRateLimit(`guest-claim:${userId}:${body.action}`, body.action === 'request' ? 5 : 30, 3600000)
    if (!quota.success) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfterSec || 60) } })
    if (!(await connectDB())) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    if (body.action === 'request') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return NextResponse.json({ error: 'Enter a valid checkout email' }, { status: 400 })
      }
      if (emailConfigurationError()) {
        return NextResponse.json({ error: 'Email verification is unavailable right now. Please try again later.' }, { status: 503 })
      }
      const emailKey = crypto.createHash('sha256').update(email).digest('hex')
      const cooldown = await checkRateLimit(`guest-claim-email:${userId}:${emailKey}`, 1, 60000)
      if (!cooldown.success) return NextResponse.json({ error: 'Please wait a minute before requesting another link.' }, { status: 429 })
      const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const guestOrdersExist = await Order.exists({ userId: null, userEmail: new RegExp(`^${escapedEmail}$`, 'i') })
      if (guestOrdersExist) {
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
        if (!result.success) {
          await GuestOrderClaim.deleteOne({ _id: claim._id })
          console.error('Guest order verification email was not accepted', { code: result.code })
        }
        // Keep earlier unexpired links valid: a failed resend must not invalidate them.
      }
      return NextResponse.json({ message: MESSAGE })
    }

    const token = typeof body.token === 'string' ? body.token : ''
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const transaction = await GuestOrderClaim.db.startSession()
    let claimed = 0
    let alreadyLinked = false
    try {
      await transaction.withTransaction(async () => {
        const claim = await GuestOrderClaim.findOne({ tokenHash, userId, expiresAt: { $gt: new Date() } }).session(transaction)
        if (!claim) throw new Error('ClaimLinkInvalid')
        if (claim.consumedAt) {
          claimed = claim.claimedCount || 0
          alreadyLinked = true
          return
        }
        alreadyLinked = false
        const escapedEmail = claim.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const result = await Order.updateMany(
          { userId: null, userEmail: new RegExp(`^${escapedEmail}$`, 'i') },
          { $set: { userId } }, { session: transaction },
        )
        claimed = result.modifiedCount
        claim.consumedAt = new Date()
        claim.claimedCount = claimed
        await claim.save({ session: transaction })
      }, { timeoutMS: 20000, maxCommitTimeMS: 5000 })
    } finally { await transaction.endSession() }
    return NextResponse.json({ claimed, alreadyLinked }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof Error && error.message === 'ClaimLinkInvalid') {
      return NextResponse.json({ error: 'This link is invalid or expired, or belongs to another account. Request a new link.', code: 'CLAIM_LINK_INVALID' }, { status: 400 })
    }
    console.error('Guest order claim failed', { type: error instanceof Error ? error.name : 'Error' })
    return NextResponse.json({ error: 'Could not link guest orders. Please try again.' }, { status: 500 })
  }
}
