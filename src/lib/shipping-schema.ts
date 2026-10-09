import { deliverySettings, shippingCountries } from '@/config/fulfillment'

export const shippingDetailsJsonLd = {
  '@type': 'OfferShippingDetails',
  shippingLabel: 'One-jacket standard shipping',
  shippingRate: { '@type': 'MonetaryAmount', value: deliverySettings.singleJacketShipping.toFixed(2), currency: 'USD' },
  shippingDestination: shippingCountries.map(code => ({ '@type': 'DefinedRegion', addressCountry: code })),
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: deliverySettings.handlingMin, maxValue: deliverySettings.handlingMax, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: deliverySettings.transitMin, maxValue: deliverySettings.transitMax, unitCode: 'DAY' },
    businessDays: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: deliverySettings.businessDays.map(day => `https://schema.org/${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}`),
    },
  },
}
