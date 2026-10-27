import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPostSignInDestination, getSafeAuthCallback } from '@/lib/auth-redirect'

// No page or client session fetch between OAuth success and the destination.
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const callback = getSafeAuthCallback(request.nextUrl.searchParams.get('callbackUrl'))
  const destination = token?.userId
    ? getPostSignInDestination(token.role, callback)
    : `/login${callback ? `?callbackUrl=${encodeURIComponent(callback)}` : ''}`
  const response = NextResponse.redirect(new URL(destination, process.env.NEXTAUTH_URL || request.url))
  response.headers.set('Cache-Control', 'no-store')
  return response
}
