import { NextRequest, NextResponse } from 'next/server'
import { requireGuestActivityAdmin } from '@/lib/guest-activity-admin'
import { parseGuestActivityFilters } from '@/lib/guest-activity-list'
import { readGuestActivity } from '@/lib/guest-activity-data'

export async function GET(request: NextRequest) {
  try {
    const denied = await requireGuestActivityAdmin()
    if (denied) return denied
    let filters
    try { filters = parseGuestActivityFilters(request.nextUrl.searchParams) }
    catch (cause) { return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Invalid filters' }, { status: 400 }) }
    const data = await readGuestActivity(filters, request.nextUrl.searchParams.get('options') !== '0')
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (cause) {
    console.error('Admin guest activity read failed', { type: cause instanceof Error ? cause.name : 'Error' })
    return NextResponse.json({ error: 'Guest activity could not load. Previous results have been kept; please retry.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
