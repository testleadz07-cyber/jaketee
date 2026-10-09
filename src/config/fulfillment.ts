import { allCountries, allCountryCodes, stripeUnsupportedCountries } from './shipping-countries'

export const deliverySettings = {
  handlingMin: 6, handlingMax: 7, transitMin: 5, transitMax: 7,
  businessDays: [1, 2, 3, 4, 5],
  cutoffTimezone: 'America/Chicago', cutoff: '23:59:59',
  returnDays: 10, singleJacketShipping: 45,
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
export const returnPolicyText = {
  eligibility: `Eligible, non-customized stock jackets can be returned within ${deliverySettings.returnDays} days of delivery.`,
  fee: 'A restocking fee of 15% of the jacket price, with a minimum of $35, is deducted from approved change-of-mind returns.',
  personalized: 'Personalized or custom items',
  customExchange: 'Custom jackets are not exchangeable for a change of mind',
  faulty: 'If your jacket arrives faulty or incorrect, contact us with your order number and photos. We will review the issue and arrange an appropriate remedy. The change-of-mind restocking fee does not apply to these cases.',
} as const

export const deliveryTooltip = `Made and shipped in ${deliverySettings.handlingMin}–${deliverySettings.handlingMax} business days after your design is approved. Delivery takes ${deliverySettings.transitMin}–${deliverySettings.transitMax} business days. Customs in some countries can add time.`

export const fulfillmentConfig = {
  individualProduction: `Made and shipped in ${deliverySettings.handlingMin}–${deliverySettings.handlingMax} business days after your design is approved.`,
  individualDelivery: `Delivery takes ${deliverySettings.transitMin}–${deliverySettings.transitMax} business days. Customs in some countries can add time.`,
  bulkProductionDelivery: process.env.NEXT_PUBLIC_BULK_PRODUCTION_DELIVERY_WINDOW || 'Orders of 10 or more jackets typically take 3-4 weeks in total, including production and delivery.',
  singleJacketShipping: `$${STANDARD_SHIPPING_USD} USD for one jacket.`,
  multipleJacketShipping: 'Two or more jackets require a shipping quote based on quantity and package weight.',
  internationalShipping: `${shippingCoverageText} Delivery takes ${deliverySettings.transitMin}–${deliverySettings.transitMax} business days after dispatch. Customs processing can add time in some countries.`,
  freeShipping: 'Free shipping applies only when an eligible free-shipping coupon is accepted at checkout.',
} as const
