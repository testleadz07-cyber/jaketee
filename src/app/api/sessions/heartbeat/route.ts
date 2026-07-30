import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const loginSessionId = (session.user as any).loginSessionId
    if (!loginSessionId) {
      return NextResponse.json({ ok: false, reason: 'no session id' }, { status: 200 })
    }

    const db = await connectDB()
    if (!db) return NextResponse.json({ ok: false }, { status: 503 })

    const LoginSession = (await import('@/models/LoginSession')).default

    // Resolve client IP for session metadata enrichment
    const xForwardedFor = request.headers.get('x-forwarded-for')
    const ip = xForwardedFor
      ? xForwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || 'Unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    // Try to parse country from body (client can pass it on first heartbeat)
    let country: string | undefined
    try {
      const body = await request.json()
      country = body?.country || undefined
    } catch {
      // body may be empty on sendBeacon calls
    }

    const update: Record<string, any> = { lastSeenAt: new Date() }
    if (ip && ip !== 'Unknown') update.ip = ip
    if (userAgent) update.userAgent = userAgent
    if (country) update.country = country

    await LoginSession.findOneAndUpdate(
      { _id: loginSessionId, logoutAt: { $exists: false } },
      { $set: update }
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
