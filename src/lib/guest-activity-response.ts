function record(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const date = (value: unknown) => value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value)))
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')

export function isGuestStatsData(value: unknown): value is {
  actions: { name: string; value: number }[]; pages: { name: string; value: number }[];
  timeline: { date: string; count: number }[]; countries: string[];
  totalActivities: number; uniqueActions: number; uniquePages: number; uniqueDays: number;
  firstSeen: string | null; lastSeen: string | null;
} {
  if (!record(value)) return false
  const breakdown = (items: unknown) => Array.isArray(items) && items.every(item => record(item) && typeof item.name === 'string' && count(item.value))
  return breakdown(value.actions) && breakdown(value.pages) &&
    Array.isArray(value.timeline) && value.timeline.every(item => record(item) && typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && count(item.count)) &&
    strings(value.countries) && ['totalActivities', 'uniqueActions', 'uniquePages', 'uniqueDays'].every(key => count(value[key])) && date(value.firstSeen) && date(value.lastSeen)
}

export function isGuestActivityList(value: unknown): value is {
  activities: { id: string; guestId: string; action: string; createdAt: string }[];
  pages: number; total: number; actions: string[];
} {
  return record(value) && Array.isArray(value.activities) && value.activities.every(item =>
    record(item) && ['id', 'guestId', 'action', 'createdAt'].every(key => typeof item[key] === 'string') && date(item.createdAt)) &&
    count(value.total) && count(value.pages) && value.pages >= 1 && strings(value.actions)
}
