import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Activity from '@/models/Activity'
import GuestActivity from '@/models/GuestActivity'
import { getGeoFromRequest } from '@/lib/geo'
import { MAX_ACTIVITY_BYTES, parseActivity } from '@/lib/activity-schema'
import { GUEST_ID_COOKIE, guestCookieOptions, resolveGuestIdentity } from '@/lib/guest-identity'
import { hasValidActivityOrigin } from '@/lib/activity-origin'

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('x-analytics-consent') !== 'granted') {
      return NextResponse.json({ error: 'Analytics consent required' }, { status: 403 })
    }

    if (!hasValidActivityOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
    if (Number(request.headers.get('content-length')) > MAX_ACTIVITY_BYTES) {
      return NextResponse.json({ error: 'Activity payload too large' }, { status: 413 })
    }
    // Read a bounded stream rather than allocating an unbounded JSON request.
    const reader = request.body?.getReader()
    if (!reader) return NextResponse.json({ error: 'Missing body' }, { status: 400 })
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_ACTIVITY_BYTES) {
        await reader.cancel()
        return NextResponse.json({ error: 'Activity payload too large' }, { status: 413 })
      }
      chunks.push(value)
    }
    let event: ReturnType<typeof parseActivity>
    try {
      event = parseActivity(JSON.parse(Buffer.concat(chunks).toString('utf8')))
    } catch {
      return NextResponse.json({ error: 'Invalid activity payload' }, { status: 400 })
    }
    const { action, details } = event

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const xForwardedFor = request.headers.get('x-forwarded-for')
    const ip = xForwardedFor
      ? xForwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || undefined
    const geo = getGeoFromRequest(request)
    const country = geo.country || (ip === '127.0.0.1' || ip === '::1' ? 'Localhost' : 'Unknown')

    const session = await getServerSession(authOptions)

    if (session?.user) {
      const userId = (session.user as any).id
      const mongoose = await import('mongoose')
      await Activity.create({
        userId: new mongoose.Types.ObjectId(userId),
        action,
        details,
        ip,
        userAgent,
        country,
        region: geo.region,
        city: geo.city,
      })

      return NextResponse.json({ success: true })
    }

    // No session - track as a guest, identified by a long-lived cookie.
    const identity = resolveGuestIdentity(request.cookies.get(GUEST_ID_COOKIE)?.value, process.env.NEXTAUTH_SECRET || '')
    const { guestId } = identity

    await GuestActivity.create({
      guestId,
      action,
      details,
      ip,
      userAgent,
      country,
      region: geo.region,
      city: geo.city,
    })

    const response = NextResponse.json({ success: true })
    if (identity.isNew) {
      response.cookies.set(GUEST_ID_COOKIE, identity.cookie, guestCookieOptions)
    }
    return response
  } catch (error: any) {
    console.error('Failed to log activity:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/** Consent withdrawal resets identity, without deleting historical records. */
export async function DELETE(request: NextRequest) {
  if (request.headers.get('x-analytics-consent') !== 'denied' || !hasValidActivityOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 403 })
  }
  const response = NextResponse.json({ success: true })
  response.cookies.set(GUEST_ID_COOKIE, '', { ...guestCookieOptions, maxAge: 0 })
  return response
}
