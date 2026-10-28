export const ACTIVITY_REPORTING_TIMEZONE = 'Asia/Karachi'

function parseDay(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Dates must use YYYY-MM-DD')
  const date = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Invalid date')
  // Pakistan observes UTC+05:00 year-round; interpret filters as local midnight.
  return new Date(date.getTime() - 5 * 60 * 60 * 1000)
}

export function activityDateRange(params: URLSearchParams, defaultDays?: number, now = new Date()) {
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const start = from ? parseDay(from) : undefined
  const end = to ? parseDay(to) : undefined
  if (start && end && start > end) throw new Error('Start date must not follow end date')
  const range: { $gte?: Date; $lt?: Date } = {}
  if (start) range.$gte = start
  if (end) range.$lt = new Date(end.getTime() + 86400000)
  if (defaultDays && !from && !to) {
    range.$lt = new Date(now)
    range.$gte = new Date(now.getTime() - defaultDays * 86400000)
  }
  if (defaultDays) {
    range.$lt ||= new Date(now)
    range.$gte ||= new Date(range.$lt.getTime() - defaultDays * 86400000)
    if (range.$gte >= range.$lt) throw new Error('Start date must precede the end of the range')
    if (range.$lt.getTime() - range.$gte.getTime() > 366 * 86400000) throw new Error('Statistics date range must not exceed 366 days')
  }
  return range
}

export function activityFilterText(params: URLSearchParams, key: string, max = 200) {
  const value = params.get(key)?.trim() || ''
  if (value.length > max) throw new Error(`${key} is too long`)
  return value
}

export function activityExcludedCountries(params: URLSearchParams) {
  return [...new Set(params.getAll('excludeCountry').map((value) => {
    const country = value.trim()
    if (country.length > 200) throw new Error('excludeCountry is too long')
    return country.toLowerCase()
  }).filter(Boolean))]
}

export function activityCountryExclusions(countries: string[]) {
  return countries.map((country) => new RegExp(`^${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
}
