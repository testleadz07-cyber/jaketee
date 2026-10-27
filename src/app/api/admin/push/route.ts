import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import LoginSession from '@/models/LoginSession'
import PushDevice from '@/models/PushDevice'
import { isPushConfigured } from '@/lib/push-config'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

class PushDatabaseTimeout extends Error {}
async function checkDatabase<T>(operation: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([Promise.resolve(operation), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new PushDatabaseTimeout('The database did not respond. Please check the server database connection and try again.')), 8000)
    })])
  } finally { clearTimeout(timer) }
}

async function authorize(request: NextRequest) {
  const expectedOrigin = new URL(process.env.NEXTAUTH_URL || request.url).origin
  if (request.method !== 'GET' && request.headers.get('origin') !== expectedOrigin) return { response: NextResponse.json({ error: 'Invalid request origin' }, { status: 403 }) }
  // Decode the same signed NextAuth cookie directly. Importing authOptions here
  // would also load Google sign-in and all notification-sending SDKs for GET.
  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!jwt || typeof jwt.userId !== 'string' || typeof jwt.loginSessionId !== 'string') return { response: NextResponse.json({ error: 'Please sign in again to manage notifications' }, { status: 401 }) }
  const expiresAt = new Date(typeof jwt.exp === 'number' ? jwt.exp * 1000 : NaN)
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return { response: NextResponse.json({ error: 'Your login has expired. Please sign in again to enable notifications.' }, { status: 401 }) }
  const identity = { id: jwt.userId, loginSessionId: jwt.loginSessionId }
  if (!await checkDatabase(connectDB())) return { response: NextResponse.json({ error: 'Database unavailable' }, { status: 503 }) }
  // Analytics marks logoutAt on page unload even while the auth cookie remains
  // valid. Only explicit sign-out revokes a notification login.
  const [user, login] = await checkDatabase(Promise.all([
    User.findOne({ _id: identity.id, role: 'admin', isActive: { $ne: false } }).select('_id').lean(),
    LoginSession.findOne({ _id: identity.loginSessionId, userId: identity.id, revokedAt: null }).select('_id').lean(),
  ]))
  if (!user) return { response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  if (!login) return { response: NextResponse.json({ error: 'Your login session is unavailable. Please sign in again.' }, { status: 401 }) }
  const limit = checkRateLimit(`push:${identity.id}`, request.method === 'PATCH' ? 5 : 60, 60_000)
  if (!limit.success) return { response: NextResponse.json({ error: 'Please wait before trying again' }, { status: 429 }) }
  return { identity, expiresAt }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request)
    if (auth.response) return auth.response
    return NextResponse.json({ configured: isPushConfigured() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof PushDatabaseTimeout ? error.message : 'Unable to load notification settings' }, { status: error instanceof PushDatabaseTimeout ? 503 : 500 })
  }
}

async function mutate(request: NextRequest) {
  try {
    const auth = await authorize(request)
    if (auth.response) return auth.response
    const body = await request.json().catch(() => null)
    if (typeof body?.token !== 'string' || body.token.length < 20 || body.token.length > 4096 || /\s/.test(body.token)) return NextResponse.json({ error: 'Invalid device registration' }, { status: 400 })
    const { identity, expiresAt } = auth
    if (request.method === 'DELETE') {
      await checkDatabase(PushDevice.deleteOne({ userId: identity.id, token: body.token }))
      return NextResponse.json({ success: true })
    }
    if (!isPushConfigured()) return NextResponse.json({ error: 'Firebase push is not configured yet' }, { status: 503 })
    if (request.method === 'PATCH') {
      const { sendAdminPush } = await import('@/lib/push-notifications')
      const result = await sendAdminPush({ id: `test-${Date.now()}`, type: 'test', userId: identity.id, token: body.token })
      return NextResponse.json(result, { status: result.successCount ? 200 : 502 })
    }
    // Token ownership is bound to the current authenticated login, not client-supplied IDs.
    await checkDatabase(PushDevice.findOneAndUpdate({ token: body.token }, { $set: { userId: identity.id, loginSessionId: identity.loginSessionId, lastSeenAt: new Date(), expiresAt } }, { upsert: true, runValidators: true }))
    return NextResponse.json({ success: true })
  } catch (error) {
    // Log diagnostic identifiers without exposing registration tokens or keys.
    console.error('Admin push request failed', { method: request.method, name: error instanceof Error ? error.name : 'Unknown', code: (error as { code?: string | number })?.code })
    return NextResponse.json({ error: error instanceof PushDatabaseTimeout ? error.message : 'Unable to update notification settings' }, { status: error instanceof PushDatabaseTimeout ? 503 : 500 })
  }
}

export const POST = mutate
export const DELETE = mutate
export const PATCH = mutate
