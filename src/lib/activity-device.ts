export type ActivityDeviceType = 'Mobile' | 'Tablet' | 'Desktop' | 'Bot' | 'Unknown'
export const ACTIVITY_DEVICE_TYPES: ActivityDeviceType[] = ['Desktop', 'Mobile', 'Tablet', 'Bot', 'Unknown']

const unknownAgent = /^(unknown|n\/a|server-side)$/i
const botAgent = /bot|crawler|spider|slurp|facebookexternalhit/i
const tabletAgent = /ipad|tablet|kindle|silk|playbook|macintosh.*mobile|android(?!.*mobile)/i
const mobileAgent = /iphone|ipod|android|mobile|windows phone/i
const desktopAgent = /windows|macintosh|mac os|x11|linux|cros/i

/** A display hint from the saved user agent; missing data is never a desktop. */
export function getActivityDevice(userAgent?: string | null): ActivityDeviceType {
  const agent = userAgent?.trim() || ''
  if (!agent || unknownAgent.test(agent)) return 'Unknown'
  if (botAgent.test(agent)) return 'Bot'
  if (tabletAgent.test(agent)) return 'Tablet'
  if (mobileAgent.test(agent)) return 'Mobile'
  if (desktopAgent.test(agent)) return 'Desktop'
  return 'Unknown'
}

/** Match the display classifier before database pagination and counting. */
export function activityDeviceExpression() {
  const input = { $trim: { input: { $ifNull: ['$userAgent', ''] } } }
  return { $switch: { branches: [
    { case: { $eq: [input, ''] }, then: 'Unknown' },
    ...([
      [unknownAgent, 'Unknown'], [botAgent, 'Bot'], [tabletAgent, 'Tablet'],
      [mobileAgent, 'Mobile'], [desktopAgent, 'Desktop'],
    ] as const).map(([pattern, device]) => ({
      case: { $regexMatch: { input, regex: pattern.source, options: 'i' } }, then: device,
    })),
  ], default: 'Unknown' } }
}
