export function getWhatsAppUrl(message?: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  if (!number) return null
  const params = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${number}${params}`
}
