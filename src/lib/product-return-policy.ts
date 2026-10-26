import { deliverySettings, returnPolicyText, shippingCountries } from '../config/fulfillment'

type CustomizableProduct = {
  embroidery?: { available: boolean } | null
  measurementFields?: string[] | null
}

// Google accepts at most 50 applicable countries per MerchantReturnPolicy.
// Keep every supported destination by emitting multiple identical policies.
export function withReturnPolicyCountries<T extends object>(policy: T) {
  const policies: Array<T & { applicableCountry: string[] }> = []
  for (let offset = 0; offset < shippingCountries.length; offset += 50) {
    policies.push({ ...policy, applicableCountry: shippingCountries.slice(offset, offset + 50) })
  }
  return policies
}

export function isPersonalizedProduct(product: CustomizableProduct) {
  return Boolean(product.embroidery?.available || product.measurementFields?.length)
}

export function getProductReturnLabel(product: CustomizableProduct) {
  return isPersonalizedProduct(product)
    ? 'Custom item: returns for manufacturing faults only'
    : `Returns & exchanges accepted within ${deliverySettings.returnDays} days`
}

export function getProductReturnPolicy(product: CustomizableProduct, siteUrl: string) {
  const personalized = isPersonalizedProduct(product)
  return withReturnPolicyCountries({
    '@type': 'MerchantReturnPolicy',
    returnPolicyCategory: personalized
      ? 'https://schema.org/MerchantReturnNotPermitted'
      : 'https://schema.org/MerchantReturnFiniteReturnWindow',
    ...(!personalized && {
      merchantReturnDays: deliverySettings.returnDays,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
    }),
    description: personalized
      ? `Custom items cannot be returned for a change of mind. Manufacturing fault claims are handled separately. ${returnPolicyText.faulty}`
      : `${returnPolicyText.eligibility} ${returnPolicyText.fee}`,
    merchantReturnLink: `${siteUrl}/returns`,
    url: `${siteUrl}/returns`,
  })
}
