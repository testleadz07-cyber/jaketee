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

    const loginSession = await LoginSession.findById(loginSessionId)
    if (loginSession && !loginSession.logoutAt) {
      loginSession.logoutAt = new Date()
      loginSession.lastSeenAt = new Date()
      const loginAt =
        loginSession.loginAt instanceof Date
          ? loginSession.loginAt
          : new Date(loginSession.loginAt)
      loginSession.durationSeconds = Math.round(
        (loginSession.logoutAt.getTime() - loginAt.getTime()) / 1000
      )
      await loginSession.save()
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Session end error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
