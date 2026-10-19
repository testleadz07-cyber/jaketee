import { NextRequest, NextResponse } from 'next/server'
import { requireGuestActivityAdmin } from '@/lib/guest-activity-admin'
import GuestActivity from '@/models/GuestActivity'
import { activityDateRange, activityFilterText } from '@/lib/guest-activity-query'

export async function GET(request: NextRequest) {
  try {
    const denied = await requireGuestActivityAdmin()
    if (denied) return denied

    const { searchParams } = new URL(request.url)
    let action: string, country: string, excludeCountry: string, guestId: string, dateRange: ReturnType<typeof activityDateRange>
    try {
      action = activityFilterText(searchParams, 'action') || 'all'
      country = activityFilterText(searchParams, 'country')
      excludeCountry = activityFilterText(searchParams, 'excludeCountry')
      guestId = activityFilterText(searchParams, 'guestId')
      dateRange = activityDateRange(searchParams)
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    const page = Math.min(100000, Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    const query: Record<string, any> = {}
    if (action !== 'all') {
      query.action = action
    }
    if (country) {
      query.country = { $regex: country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    }
    if (excludeCountry) {
      query.country = {
        ...query.country,
        $not: new RegExp(`^${excludeCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      }
    }
    if (guestId) {
      query.guestId = guestId
    }
    if (Object.keys(dateRange).length) query.createdAt = dateRange

    const total = await GuestActivity.countDocuments(query).maxTimeMS(10000)
    const activities = await GuestActivity.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .maxTimeMS(10000)
      .lean()

    const distinctActions = await GuestActivity.distinct('action').maxTimeMS(10000)
    const distinctCountries: unknown[] = await GuestActivity.distinct('country').maxTimeMS(10000)
    const countries = distinctCountries
      .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      activities: activities.map((a: any) => ({
        id: String(a._id),
        guestId: a.guestId,
        action: a.action,
        details: a.details,
        ip: a.ip,
        userAgent: a.userAgent,
        country: a.country,
        region: a.region,
        city: a.city,
        createdAt: a.createdAt,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      actions: distinctActions,
      countries,
    })
  } catch (error: any) {
    console.error('Admin guest activity fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch guest activity' }, { status: 500 })
  }
}
