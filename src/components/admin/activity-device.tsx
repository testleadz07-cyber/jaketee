import { Bot, CircleHelp, Monitor, Smartphone, Tablet } from 'lucide-react'
import { getActivityDevice } from '@/lib/activity-device'

const icons = { Mobile: Smartphone, Tablet, Desktop: Monitor, Bot, Unknown: CircleHelp }

export function ActivityDevice({ userAgent }: { userAgent?: string | null }) {
  const device = getActivityDevice(userAgent)
  const Icon = icons[device]
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground" title={userAgent || undefined}><Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{device}</span>
}
