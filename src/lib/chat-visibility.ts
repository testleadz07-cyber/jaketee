/** Unknown locations stay hidden so a failed lookup cannot expose chat in Pakistan. */
export function canShowAiChat(country: string | undefined, isAdmin: boolean): boolean {
  if (isAdmin) return true
  const code = country?.trim().toUpperCase()
  return !!code && /^[A-Z]{2}$/.test(code) && code !== 'PK' && code !== 'XX'
}
