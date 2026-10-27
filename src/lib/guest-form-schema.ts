/** Explicit field lists only: never serialize an entire form or request body. */
export const GUEST_FORM_FIELDS = {
  newsletter: { email: 254 },
  contact: { name: 100, email: 254, subject: 200, message: 2000, country: 100 },
  bulk_quote: { name: 200, email: 254, organization: 200, quantity: 30, jacketType: 200, deadline: 40, country: 100, program: 200, notes: 2000 },
  checkout: { name: 200, email: 254, phone: 50, street: 500, city: 200, state: 200, zip: 32, country: 100, paymentMethod: 30, promoCode: 100, step: 30 },
  returns: { orderNumber: 100, name: 200, email: 254, reason: 2000 },
  track_order: { orderNumber: 100, email: 254 },
  order_confirmation: { email: 254 },
  registration: { name: 200, username: 30, email: 254 },
  login: { identifier: 254 },
  forgot_password: { email: 254 },
} as const
export type GuestFormName = keyof typeof GUEST_FORM_FIELDS
export const FORM_ACTIVITY_VERSION = 1
export const isGuestFormAction = (action: string) => action === 'guest_form_draft' || action === 'guest_form_submitted'
export const guestFormLabels: Record<GuestFormName, string> = {
  newsletter: 'Newsletter', contact: 'Contact us', bulk_quote: 'Bulk quote', checkout: 'Checkout',
  returns: 'Return request', track_order: 'Track order', order_confirmation: 'Order confirmation',
  registration: 'Registration', login: 'Sign in', forgot_password: 'Password recovery',
}

// Defense in depth for secrets accidentally pasted into an otherwise allowed field.
function redact(value: string) {
  return value
    .replace(/\b(?:password|passwd|authorization|api[_ -]?key|secret|token)\s*[:=]\s*\S+/gi, '[redacted]')
    .replace(/\b(?:sk|pk)_(?:live|test)_[a-z0-9]+\b/gi, '[redacted]')
    .replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, '[redacted]')
    .replace(/\b(?:\d[ -]?){12,18}\d\b/g, candidate => {
      const digits = candidate.replace(/\D/g, '')
      if (digits.length < 13 || digits.length > 19) return candidate
      let sum = 0
      for (let i = digits.length - 1, alternate = false; i >= 0; i--, alternate = !alternate) {
        let n = Number(digits[i]); if (alternate) { n *= 2; if (n > 9) n -= 9 }; sum += n
      }
      return sum % 10 === 0 ? '[payment number redacted]' : candidate
    })
}

export function sanitizeGuestForm(form: unknown, input: unknown) {
  if (typeof form !== 'string' || !Object.hasOwn(GUEST_FORM_FIELDS, form) || !input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid guest form')
  }
  const fields: Record<string, string> = {}
  let truncated = false
  const encoder = new TextEncoder()
  for (const [key, limit] of Object.entries(GUEST_FORM_FIELDS[form as GuestFormName])) {
    const raw = (input as Record<string, unknown>)[key]
    if (raw === undefined || raw === null || raw === '') continue
    if (typeof raw !== 'string' && !(typeof raw === 'number' && Number.isFinite(raw))) continue
    const text = String(raw).trim().replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    if (text.length > limit) truncated = true
    const safe = redact(text.slice(0, limit))
    if (!safe) continue
    fields[key] = safe
    // Leave room inside the existing bounded 8 KB activity request.
    while (encoder.encode(JSON.stringify(fields)).byteLength > 6000 && fields[key]) {
      fields[key] = Array.from(fields[key]).slice(0, -32).join(''); truncated = true
    }
    if (!fields[key]) delete fields[key]
  }
  return { form: form as GuestFormName, fields, truncated }
}
