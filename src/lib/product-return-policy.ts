import { deliverySettings, returnPolicyText, shippingCountries } from '../config/fulfillment'

type CustomizableProduct = {
  embroidery?: { available: boolean } | null
  measurementFields?: string[] | null
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
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: shippingCountries,
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
  }
}
