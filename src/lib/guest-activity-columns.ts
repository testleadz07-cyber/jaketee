export const ACTIVITY_COLUMNS = [
  { id: 'time', label: 'Time' }, { id: 'id', label: 'Activity ID' },
  { id: 'guestId', label: 'Guest ID' }, { id: 'action', label: 'Action' },
  { id: 'details', label: 'Details' }, { id: 'country', label: 'Country' },
  { id: 'region', label: 'Region' }, { id: 'city', label: 'City' },
  { id: 'device', label: 'Device' }, { id: 'ip', label: 'IP' },
  { id: 'userAgent', label: 'User Agent' }, { id: 'graphs', label: 'Graphs' },
] as const
export type ActivityColumn = typeof ACTIVITY_COLUMNS[number]['id']
export const DEFAULT_ACTIVITY_COLUMNS: ActivityColumn[] = ['time', 'guestId', 'action', 'details', 'country', 'city', 'device']
export const ACTIVITY_COLUMNS_KEY = 'jacketee.admin.guestActivity.columns.v1'
export function parseActivityColumns(value: unknown): ActivityColumn[] {
  if (!Array.isArray(value)) return [...DEFAULT_ACTIVITY_COLUMNS]
  const selected = ACTIVITY_COLUMNS.filter(column => value.includes(column.id)).map(column => column.id)
  return selected.length ? selected : [...DEFAULT_ACTIVITY_COLUMNS]
}
