import { activityDateRange, activityFilterText, activityExcludedCountries, activityCountryExclusions } from './guest-activity-query'
import { ACTIVITY_DEVICE_TYPES, activityDeviceExpression, type ActivityDeviceType } from './activity-device'

export interface GuestActivityFilters {
  action: string; country: string; excludedCountries: string[]; excludedDevices: ActivityDeviceType[]; guestId: string; from: string; to: string; page: number; limit: number
}
export interface GuestActivityListData {
  loadedColumns?: string[]
  activities: { id: string; guestId: string; action: string; createdAt: string; details?: Record<string, unknown>; ip?: string; userAgent?: string; country?: string; region?: string; city?: string }[]
  total: number; page: number; pages: number; actions: string[]; countries: string[]
}
export function parseGuestActivityFilters(params: URLSearchParams, pageDefaults = false): GuestActivityFilters {
  const normalized = new URLSearchParams(params)
  // Default view hides test/local traffic; an explicit empty exclusion shows everyone.
  if (pageDefaults && !normalized.has('excludeCountry')) ['PK', 'Localhost'].forEach(country => normalized.append('excludeCountry', country))
  if (!normalized.has('excludeDevice')) normalized.append('excludeDevice', 'Bot')
  const excludedDevices = [...new Set(normalized.getAll('excludeDevice').map(value => value.trim()).filter(Boolean))]
  if (excludedDevices.some(value => !ACTIVITY_DEVICE_TYPES.includes(value as ActivityDeviceType))) throw new Error('Invalid excluded device')
  activityDateRange(normalized)
  activityExcludedCountries(normalized)
  return {
    excludedDevices: excludedDevices as ActivityDeviceType[],
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
  if (filters.excludedDevices.length) filters.excludedDevices.forEach(device => params.append('excludeDevice', device))
  else params.set('excludeDevice', '')
  return params
}
export function guestActivityQuery(filters: GuestActivityFilters): Record<string, any> {
  const query: Record<string, any> = {}
  if (filters.excludedDevices.length) query.$expr = { $not: [{ $in: [activityDeviceExpression(), filters.excludedDevices] }] }
  if (filters.action !== 'all') query.action = filters.action
  if (filters.country) query.country = { $regex: filters.country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (filters.excludedCountries.length) query.country = { ...query.country, $nin: activityCountryExclusions(filters.excludedCountries) }
  if (filters.guestId) query.guestId = filters.guestId
  const dates = activityDateRange(guestActivityParams(filters))
  if (Object.keys(dates).length) query.createdAt = dates
  return query
}
