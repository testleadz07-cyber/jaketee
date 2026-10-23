import { normalizeShippingCountry, shippingCountryError } from '@/config/fulfillment'

export const contactLimits = { name: 100, email: 254, subject: 200, message: 5000 } as const
export type ContactValues = { name: string; email: string; subject: string; message: string; country: string }
export type ContactErrors = Partial<Record<keyof ContactValues, string>>

export function validateContact(input: unknown): { values: ContactValues; errors: ContactErrors } {
  const body = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {}
  const values: ContactValues = { name: '', email: '', subject: '', message: '', country: '' }
  const errors: ContactErrors = {}
  for (const field of ['name', 'email', 'subject', 'message'] as const) {
    values[field] = typeof body[field] === 'string' ? body[field].trim() : ''
    if (!values[field]) errors[field] = `Please enter your ${field === 'subject' ? 'subject' : field}.`
    else if (values[field].length > contactLimits[field]) errors[field] = `Use ${contactLimits[field]} characters or fewer.`
  }
  if (values.email && !errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.'
  if (body.country) {
    const countryError = shippingCountryError(body.country)
    if (countryError) errors.country = countryError
    else values.country = normalizeShippingCountry(body.country) || ''
  }
  return { values, errors }
}
