import { DEFAULT_ACTIVITY_COLUMNS } from '@/lib/guest-activity-columns'
import { requireAdminPage } from '@/lib/require-admin'
import { readGuestActivity } from '@/lib/guest-activity-data'
import { parseGuestActivityFilters, type GuestActivityListData } from '@/lib/guest-activity-list'
import GuestActivityClient from '@/components/admin/guest-activity-client'

export const dynamic = 'force-dynamic'

export default async function AdminGuestActivityPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdminPage()
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach(item => params.append(key, item))
    else if (value !== undefined) params.set(key, value)
  }
  let initialError = ''
  let filters
  try { filters = parseGuestActivityFilters(params, true) }
  catch (cause) {
    initialError = cause instanceof Error ? cause.message : 'Invalid filters'
    filters = parseGuestActivityFilters(new URLSearchParams(), true)
  }
  let initialData: GuestActivityListData = { activities: [], total: 0, page: 1, pages: 1, actions: [], countries: [] }
  if (!initialError) {
    try { initialData = await readGuestActivity(filters, true, DEFAULT_ACTIVITY_COLUMNS); filters = { ...filters, page: initialData.page } }
    catch (cause) {
      console.error('Initial guest activity read failed', { type: cause instanceof Error ? cause.name : 'Error' })
      initialError = 'Guest activity could not load. Use Refresh to try again.'
    }
  }
  return <GuestActivityClient initialFilters={filters} initialData={initialData} initialError={initialError} />
}
