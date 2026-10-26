export type ActivityDeviceType = 'Mobile' | 'Tablet' | 'Desktop' | 'Bot' | 'Unknown'

/** A display hint from the saved user agent; missing data is never a desktop. */
export function getActivityDevice(userAgent?: string | null): ActivityDeviceType {
  const agent = userAgent?.trim() || ''
  if (!agent || /^(unknown|n\/a|server-side)$/i.test(agent)) return 'Unknown'
  if (/bot|crawler|spider|slurp|facebookexternalhit/i.test(agent)) return 'Bot'
  if (/ipad|tablet|kindle|silk|playbook|macintosh.*mobile/i.test(agent) || /android/i.test(agent) && !/mobile/i.test(agent)) return 'Tablet'
  if (/iphone|ipod|android|mobile|windows phone/i.test(agent)) return 'Mobile'
  if (/windows|macintosh|mac os|x11|linux|cros/i.test(agent)) return 'Desktop'
  return 'Unknown'
}
