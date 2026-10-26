import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { lookup } from 'geoip-lite'
import { authOptions } from '@/lib/auth-options'
import { getCountryFromRequest } from '@/lib/geo'
import { getClientIp } from '@/lib/rate-limit'
import { canShowAiChat } from '@/lib/chat-visibility'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin'
  const country = getCountryFromRequest(request) || lookup(getClientIp(request))?.country
  return NextResponse.json(
    { enabled: canShowAiChat(country, isAdmin) },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } },
  )
}
