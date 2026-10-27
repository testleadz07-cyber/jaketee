import { NextRequest, NextResponse } from 'next/server'
import { requireGuestActivityAdmin } from '@/lib/guest-activity-admin'
import GuestActivity from '@/models/GuestActivity'
import { ACTIVITY_REPORTING_TIMEZONE, activityDateRange, activityFilterText } from '@/lib/guest-activity-query'

export async function GET(request: NextRequest) {
  try {
    const denied = await requireGuestActivityAdmin()
    if (denied) return denied
    const { searchParams } = new URL(request.url)
    let guestId: string, range: ReturnType<typeof activityDateRange>
    try {
      guestId = activityFilterText(searchParams, 'guestId')
      if (!guestId) throw new Error('Guest ID is required')
      range = activityDateRange(searchParams, 90)
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    const match: Record<string, unknown> = { guestId }
    if (Object.keys(range).length) match.createdAt = range
    const [result] = await GuestActivity.aggregate([
      { $match: match },
      { $facet: {
        summary: [{ $group: {
          _id: null, totalActivities: { $sum: 1 },
          firstSeen: { $min: '$createdAt' }, lastSeen: { $max: '$createdAt' },
          countries: { $addToSet: '$country' },
        } }],
        actions: [
          { $group: { _id: '$action', value: { $sum: 1 } } },
          { $sort: { value: -1, _id: 1 } },
          { $project: { _id: 0, name: '$_id', value: 1 } },
        ],
        pages: [
          // New page views have a dedicated event; clicks/cart actions are not visits.
          { $match: { action: 'page_view', 'details.path': { $type: 'string', $regex: '^/(?!/)' } } },
          { $group: { _id: '$details.path', value: { $sum: 1 } } },
          { $sort: { value: -1, _id: 1 } },
          { $limit: 10 },
          { $project: { _id: 0, name: '$_id', value: 1 } },
        ],
        uniquePages: [
          { $match: { action: 'page_view', 'details.path': { $type: 'string', $regex: '^/(?!/)' } } },
          { $group: { _id: '$details.path' } },
          { $count: 'count' },
        ],
        timeline: [
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ACTIVITY_REPORTING_TIMEZONE } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: '$_id', count: 1 } },
        ],
      } },
    ]).option({ maxTimeMS: 10000 })
    const summary = result?.summary?.[0]
    return NextResponse.json({
      actions: result?.actions || [], pages: result?.pages || [], timeline: result?.timeline || [],
      totalActivities: summary?.totalActivities || 0,
      uniqueActions: result?.actions?.length || 0,
      uniquePages: result?.uniquePages?.[0]?.count || 0,
      uniqueDays: result?.timeline?.length || 0,
      firstSeen: summary?.firstSeen || null, lastSeen: summary?.lastSeen || null,
      countries: (summary?.countries || []).filter((value: unknown) => typeof value === 'string' && value),
      timezone: ACTIVITY_REPORTING_TIMEZONE,
      from: range.$gte?.toISOString() || null, to: range.$lt?.toISOString() || null,
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Admin guest activity stats fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch guest activity stats' }, { status: 500 })
  }
}
