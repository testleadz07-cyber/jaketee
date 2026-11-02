import { activityDateRange, activityFilterText, activityExcludedCountries, activityCountryExclusions } from './guest-activity-query'

export interface GuestActivityFilters {
  action: string; country: string; excludedCountries: string[]; guestId: string; from: string; to: string; page: number; limit: number
}
export interface GuestActivityListData {
  activities: { id: string; guestId: string; action: string; createdAt: string; details?: Record<string, unknown>; ip?: string; userAgent?: string; country?: string; region?: string; city?: string }[]
  total: number; page: number; pages: number; actions: string[]; countries: string[]
}
export function parseGuestActivityFilters(params: URLSearchParams, pageDefaults = false): GuestActivityFilters {
  const normalized = new URLSearchParams(params)
  if (pageDefaults && !normalized.has('excludeCountry')) ['PK', 'Localhost'].forEach(country => normalized.append('excludeCountry', country))
  activityDateRange(normalized)
  activityExcludedCountries(normalized)
  return {
    action: activityFilterText(normalized, 'action') || 'all', country: activityFilterText(normalized, 'country'),
    excludedCountries: [...new Set(normalized.getAll('excludeCountry').map(value => value.trim()).filter(Boolean))], guestId: activityFilterText(normalized, 'guestId'),
    from: normalized.get('from') || '', to: normalized.get('to') || '',
    page: Math.min(100000, Math.max(1, parseInt(normalized.get('page') || '1', 10) || 1)),
    limit: Math.min(100, Math.max(1, parseInt(normalized.get('limit') || '20', 10) || 20)),
  }
}
export function guestActivityParams(filters: GuestActivityFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) })
  if (filters.action !== 'all') params.set('action', filters.action)
  if (filters.country.trim()) params.set('country', filters.country.trim())
  if (filters.guestId.trim()) params.set('guestId', filters.guestId.trim())
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.excludedCountries.length) filters.excludedCountries.forEach(country => params.append('excludeCountry', country))
  else params.set('excludeCountry', '')
  return params
}
export function guestActivityQuery(filters: GuestActivityFilters): Record<string, any> {
  const query: Record<string, any> = {}
  if (filters.action !== 'all') query.action = filters.action
  if (filters.country) query.country = { $regex: filters.country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (filters.excludedCountries.length) query.country = { ...query.country, $nin: activityCountryExclusions(filters.excludedCountries) }
  if (filters.guestId) query.guestId = filters.guestId
  const dates = activityDateRange(guestActivityParams(filters))
  if (Object.keys(dates).length) query.createdAt = dates
  return query
}
