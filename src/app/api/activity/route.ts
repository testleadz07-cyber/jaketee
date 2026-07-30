import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Activity from '@/models/Activity'
import GuestActivity from '@/models/GuestActivity'
import { getCountryFromRequest } from '@/lib/geo'

const GUEST_ID_COOKIE = 'guest_id'
const GUEST_ID_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const { action, details } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    const xForwardedFor = request.headers.get('x-forwarded-for')
    const ip = xForwardedFor
      ? xForwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || undefined
    const country = getCountryFromRequest(request) || (ip === '127.0.0.1' || ip === '::1' ? 'Localhost' : 'Unknown')

    const session = await getServerSession(authOptions)

    if (session?.user) {
      const userId = (session.user as any).id
      const mongoose = await import('mongoose')
      const newActivity = await Activity.create({
        userId: new mongoose.Types.ObjectId(userId),
        action,
        details,
        ip,
        userAgent,
        country,
      })

      return NextResponse.json({ success: true, activity: newActivity })
    }

    // No session - track as a guest, identified by a long-lived cookie.
    let guestId = request.cookies.get(GUEST_ID_COOKIE)?.value
    const isNewGuestId = !guestId
    if (!guestId) {
      guestId = randomUUID()
    }

    const newGuestActivity = await GuestActivity.create({
      guestId,
      action,
      details,
      ip,
      userAgent,
      country,
    })

    const response = NextResponse.json({ success: true, activity: newGuestActivity })
    if (isNewGuestId) {
      response.cookies.set(GUEST_ID_COOKIE, guestId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: GUEST_ID_MAX_AGE,
        path: '/',
      })
    }
    return response
  } catch (error: any) {
    console.error('Failed to log activity:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
