import { deliverySettings } from '@/config/fulfillment'

type DeliveryConfig = Omit<typeof deliverySettings, 'holidays' | 'businessDays'> & {
  holidays: readonly string[]; businessDays: readonly number[]
}

export function estimateDelivery(now = new Date(), settings: DeliveryConfig = deliverySettings) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.cutoffTimezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: string) => parts.find(item => item.type === type)!.value
  // Calendar arithmetic in UTC avoids browser timezone and daylight-saving offsets.
  const start = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`)
  if (`${part('hour')}:${part('minute')}:${part('second')}` > settings.cutoff) start.setUTCDate(start.getUTCDate() + 1)
  const isBusinessDay = (date: Date) => settings.businessDays.includes(date.getUTCDay()) &&
    !settings.holidays.includes(date.toISOString().slice(0, 10))
  while (!isBusinessDay(start)) start.setUTCDate(start.getUTCDate() + 1)
  const addDays = (count: number) => {
    const date = new Date(start)
    for (let added = 0; added < count;) {
      date.setUTCDate(date.getUTCDate() + 1)
      if (isBusinessDay(date)) added++
    }
    return date
  }
  return {
    min: addDays(settings.handlingMin + settings.transitMin),
    max: addDays(settings.handlingMax + settings.transitMax),
  }
}

export function formatDeliveryDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date)
}
