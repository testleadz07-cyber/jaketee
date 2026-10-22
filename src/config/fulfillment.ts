import { allCountries, allCountryCodes, stripeUnsupportedCountries } from './shipping-countries'

export const deliverySettings = {
  handlingMin: 6, handlingMax: 7, transitMin: 5, transitMax: 7,
  businessDays: [1, 2, 3, 4, 5],
  cutoffTimezone: 'America/Chicago', cutoff: '23:59:59',
  returnDays: 10, singleJacketShipping: 45, additionalJacketShipping: 20,
  excludedCountries: ['IL', 'RU'], holidays: [] as string[],
  carrierExcludedCountries: [] as string[],
} as const

export const shippingCountries = allCountryCodes.filter(code =>
  !deliverySettings.excludedCountries.some(excluded => excluded === code) &&
  !stripeUnsupportedCountries.includes(code) && !deliverySettings.carrierExcludedCountries.includes(code))
export const shippingCountryOptions = allCountries.filter(country => shippingCountries.includes(country.code))
export function normalizeShippingCountry(value: unknown) {
  if (typeof value !== 'string') return null
  const text = value.trim().toLowerCase()
  const aliases: Record<string, string> = { uk: 'GB', usa: 'US', 'united states of america': 'US', 'russian federation': 'RU' }
  return aliases[text] || allCountries.find(country => country.code.toLowerCase() === text || country.name.toLowerCase() === text)?.code || null
}
export function shippingCountryError(value: unknown) {
  const code = normalizeShippingCountry(value)
  if (!code) return 'Please select a valid delivery country.'
  return shippingCountries.includes(code) ? null : `We are not able to ship to ${allCountries.find(country => country.code === code)?.name || code} at this time.`
}
export const shippingCoverageText = `We ship worldwide, except to ${deliverySettings.excludedCountries.map(code => allCountries.find(country => country.code === code)?.name || code).join(' and ')}.`
export const internationalShippingAnswer = `Yes. ${shippingCoverageText.replace(/\.$/, '')} at this time. Individual orders are made and shipped within ${deliverySettings.handlingMin}–${deliverySettings.handlingMax} business days after design approval, and delivery takes ${deliverySettings.transitMin}–${deliverySettings.transitMax} business days. Customs processing in some countries can add time, and any import duties or taxes are the buyer’s responsibility.`

export const STANDARD_SHIPPING_USD = deliverySettings.singleJacketShipping

export function calculateShipping(quantity: number, freeShipping = false): number {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Invalid shipping quantity')
  return freeShipping ? 0 : STANDARD_SHIPPING_USD + (quantity - 1) * deliverySettings.additionalJacketShipping
}
export const returnPolicyText = {
  statutoryRights: 'These store change-of-mind terms do not restrict mandatory consumer rights. Where applicable law provides a longer cancellation period, prohibits a restocking charge, or requires a refund or other remedy, that law takes precedence. Personalized items remain covered by applicable rights for faulty, damaged, incorrect or misdescribed goods.',
  eligibility: `Eligible, non-customized stock jackets can be returned within ${deliverySettings.returnDays} days of delivery.`,
  fee: 'A restocking fee of 15% of the jacket price, with a minimum of $35, is deducted from approved change-of-mind returns.',
  personalized: 'Personalized or custom items',
  customExchange: 'Custom jackets are not exchangeable for a change of mind',
  faulty: 'Please report faulty, damaged or incorrect items promptly, ideally within 48 hours of delivery, with your order number and photos. This requested reporting window does not limit statutory rights or remedies. We will review the issue and arrange an appropriate remedy. The change-of-mind restocking fee does not apply to these cases.',
} as const

// Keep database-backed FAQs aligned with the current policy, including older imports.
export function faultReportFaqAnswer(question: string, answer: string[]): string[] {
  switch (question.trim().toLowerCase()) {
    case 'what should i do if my order arrives damaged or incorrect?':
    case 'i received a faulty item, what do i do?':
      return [returnPolicyText.faulty]
    case 'can repairs be made on the garment?':
      return [`We're currently unable to offer repair services after a jacket has shipped. ${returnPolicyText.faulty}`]
    default:
      return answer
  }
}

export const deliveryTooltip = `Made and shipped in ${deliverySettings.handlingMin}–${deliverySettings.handlingMax} business days after your design is approved. Delivery takes ${deliverySettings.transitMin}–${deliverySettings.transitMax} business days. Customs in some countries can add time.`

const cutoffTime = deliverySettings.cutoff === '23:59:59' ? 'midnight' :
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'UTC' })
    .format(new Date(`2000-01-01T${deliverySettings.cutoff}Z`))
const cutoffTimezone = deliverySettings.cutoffTimezone === 'America/Chicago' ? 'US Central Time' :
  String(deliverySettings.cutoffTimezone).replace(/_/g, ' ')

export const fulfillmentConfig = {
  individualProduction: `Made and shipped in ${deliverySettings.handlingMin}–${deliverySettings.handlingMax} business days after your design is approved.`,
  processingCutoff: `Orders placed by ${cutoffTime} ${cutoffTimezone} on a business day start processing that day. Weekend orders start the next business day.`,
  individualDelivery: `Delivery takes ${deliverySettings.transitMin}–${deliverySettings.transitMax} business days. Customs in some countries can add time.`,
  bulkProductionDelivery: process.env.NEXT_PUBLIC_BULK_PRODUCTION_DELIVERY_WINDOW || 'Orders of 10 or more jackets typically take 3-4 weeks in total, including production and delivery.',
  singleJacketShipping: `$${STANDARD_SHIPPING_USD} USD for one jacket.`,
  multipleJacketShipping: `$${STANDARD_SHIPPING_USD} USD for the first jacket, plus $${deliverySettings.additionalJacketShipping} USD for each additional jacket in the same order.`,
  internationalShipping: `${shippingCoverageText} Delivery takes ${deliverySettings.transitMin}–${deliverySettings.transitMax} business days after dispatch. Customs processing can add time in some countries.`,
  freeShipping: 'Free shipping applies only when an eligible free-shipping coupon is accepted at checkout.',
} as const
