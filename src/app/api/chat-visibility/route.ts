import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCountryFromRequest } from '@/lib/geo'
import { canShowAiChat } from '@/lib/chat-visibility'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin'
  const country = getCountryFromRequest(request)
  return NextResponse.json(
    { enabled: canShowAiChat(country, isAdmin) },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } },
  )
}
