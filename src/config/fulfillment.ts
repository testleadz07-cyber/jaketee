export const fulfillmentConfig = {
  individualProduction: process.env.NEXT_PUBLIC_INDIVIDUAL_PRODUCTION_WINDOW || 'Confirmed after your design and order details are approved.',
  individualDelivery: process.env.NEXT_PUBLIC_INDIVIDUAL_DELIVERY_WINDOW || 'Confirmed for your destination before production begins.',
  bulkProductionDelivery: process.env.NEXT_PUBLIC_BULK_PRODUCTION_DELIVERY_WINDOW || 'Orders of 10 or more jackets typically take 3-4 weeks in total, including production and delivery.',
  singleJacketShipping: '$30 USD for one jacket.',
  multipleJacketShipping: 'Two or more jackets require a shipping quote based on quantity and package weight.',
  internationalShipping: 'For the United States, United Kingdom, and Canada, timing can vary by destination and customs processing.',
  freeShipping: 'Free shipping applies only when an eligible free-shipping coupon is accepted at checkout.',
} as const
