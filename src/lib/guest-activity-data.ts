import 'server-only'
import GuestActivity from '@/models/GuestActivity'
import { connectDB } from '@/lib/mongodb'
import { guestActivityQuery, type GuestActivityFilters, type GuestActivityListData } from '@/lib/guest-activity-list'

// Callers must authorize before entering this helper. No global cache of
// private activity data; filter options are omitted on ordinary pagination.
export async function readGuestActivity(filters: GuestActivityFilters, includeOptions = true): Promise<GuestActivityListData> {
  if (!await connectDB()) throw new Error('Database unavailable')
  const query = guestActivityQuery(filters)
  const total = await GuestActivity.countDocuments(query).maxTimeMS(5000)
  const pages = Math.max(1, Math.ceil(total / filters.limit))
  const page = Math.min(filters.page, pages)
  const activities = await GuestActivity.find(query).sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * filters.limit).limit(filters.limit).maxTimeMS(5000).lean()
  let actions: string[] = [], countries: string[] = []
  if (includeOptions) {
    const values = await Promise.all([
      GuestActivity.distinct('action').maxTimeMS(5000), GuestActivity.distinct('country').maxTimeMS(5000),
    ])
    actions = values[0].filter((value): value is string => typeof value === 'string' && Boolean(value.trim())).sort()
    countries = values[1].filter((value): value is string => typeof value === 'string' && Boolean(value.trim())).sort((a, b) => a.localeCompare(b))
  }
  return { total, page, pages, actions, countries, activities: activities.map((row: any) => ({
    id: String(row._id), guestId: row.guestId, action: row.action,
    createdAt: new Date(row.createdAt).toISOString(),
    details: row.details == null ? undefined : JSON.parse(JSON.stringify(row.details)),
    ip: row.ip, userAgent: row.userAgent, country: row.country, region: row.region, city: row.city,
  })) }
}
