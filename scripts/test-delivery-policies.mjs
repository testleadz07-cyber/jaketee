import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const compiled = { exports: {} }
  new Function('require', 'module', 'exports', source)(id => id in mocks ? mocks[id] : require(id), compiled, compiled.exports)
  return compiled.exports
}
const countries = load('src/config/shipping-countries.ts')
const config = load('src/config/fulfillment.ts', { './shipping-countries': countries })
const { estimateDelivery } = load('src/lib/delivery-dates.ts', { '@/config/fulfillment': config })
const iso = date => date.toISOString().slice(0, 10)
const range = (now, settings) => {
  const dates = estimateDelivery(new Date(now), settings)
  return [iso(dates.min), iso(dates.max)]
}
assert.deepEqual(range('2026-10-09T17:00:00Z'), ['2026-10-26', '2026-10-29'])
// Chicago Friday 23:59:59 remains Friday; midnight becomes Saturday -> Monday.
assert.deepEqual(range('2026-10-10T04:59:59Z'), ['2026-10-26', '2026-10-29'])
assert.deepEqual(range('2026-10-10T04:58:00Z'), ['2026-10-26', '2026-10-29'])
assert.deepEqual(range('2026-10-10T05:01:00Z'), ['2026-10-27', '2026-10-30'])
assert.deepEqual(range('2026-10-10T05:00:00Z'), ['2026-10-27', '2026-10-30'])
assert.deepEqual(range('2026-10-11T17:00:00Z'), range('2026-10-12T17:00:00Z'))
assert.deepEqual(range('2026-10-09T17:00:00Z', { ...config.deliverySettings, holidays: ['2026-10-12'] }), ['2026-10-27', '2026-10-30'])
assert.deepEqual(range('2026-10-12T17:00:00Z', { ...config.deliverySettings, holidays: ['2026-10-12'] }), range('2026-10-13T17:00:00Z'))
// Winter Central midnight uses UTC-6; summer Central midnight uses UTC-5.
assert.deepEqual(range('2026-01-10T05:59:59Z'), range('2026-01-09T18:00:00Z'))
assert.notDeepEqual(range('2026-01-10T06:00:00Z'), range('2026-01-09T18:00:00Z'))
assert.deepEqual(range('2026-03-08T07:59:59Z'), range('2026-03-08T08:00:00Z'))
assert.deepEqual(range('2026-11-01T06:59:59Z'), range('2026-11-01T07:00:00Z'))

assert.equal(countries.allCountries.length, 249)
assert.equal(new Set(config.shippingCountries).size, config.shippingCountries.length)
for (const code of [...config.deliverySettings.excludedCountries, ...countries.stripeUnsupportedCountries]) assert.ok(!config.shippingCountries.includes(code))
const stripeTypes = fs.readFileSync('node_modules/stripe/esm/resources/Checkout/Sessions.d.ts', 'utf8')
const stripeCountries = [...stripeTypes.match(/namespace ShippingAddressCollection \{\s*type AllowedCountry = ([^;]+);/)[1].matchAll(/'([A-Z]{2})'/g)].map(match => match[1])
assert.deepEqual(config.shippingCountries, countries.allCountryCodes.filter(code => !['IL', 'RU'].includes(code) && stripeCountries.includes(code)))
const popover = load('src/components/ui/popover.tsx', { '@/lib/utils': { cn: (...items) => items.filter(Boolean).join(' ') } })
const { ProductDeliveryPolicies } = load('src/components/product-delivery-policies.tsx', {
  '@/components/ui/popover': popover, '@/config/fulfillment': config,
  '@/config/shipping-countries': countries,
  '@/lib/delivery-dates': load('src/lib/delivery-dates.ts', { '@/config/fulfillment': config }),
})
for (const quantity of [1, 2, 10]) {
  const html = renderToStaticMarkup(React.createElement(ProductDeliveryPolicies, { quantity }))
  assert.ok(html.includes('aria-expanded="true"'))
  assert.ok(html.includes('Calculating delivery dates'))
  assert.ok(html.includes('Returns &amp; exchanges accepted'))
  assert.ok(!/free delivery|free shipping/i.test(html))
  assert.ok(quantity === 1 ? html.includes('Shipping: $45 USD') : html.includes('Shipping quote required for 2+ jackets'))
}
for (const countryCode of ['IL', 'RU']) {
  let stateIndex = 0
  const testReact = { ...React, useState: initial => React.useState(stateIndex++ === 2 ? countryCode : initial) }
  const component = load('src/components/product-delivery-policies.tsx', {
    react: testReact, '@/components/ui/popover': popover, '@/config/fulfillment': config,
    '@/config/shipping-countries': countries,
    '@/lib/delivery-dates': load('src/lib/delivery-dates.ts', { '@/config/fulfillment': config }),
  }).ProductDeliveryPolicies
  const html = renderToStaticMarkup(React.createElement(component, { quantity: 1 }))
  assert.ok(html.includes(`We are not able to ship to ${countryCode === 'IL' ? 'Israel' : 'Russia'} at this time.`))
}

const checkoutSource = fs.readFileSync('src/lib/checkout-order.ts', 'utf8')
const checkoutMocks = Object.fromEntries([...checkoutSource.matchAll(/from '(@\/[^']+)'/g)].map(match => [match[1], {}]))
checkoutMocks['@/config/fulfillment'] = config
const checkout = load('src/lib/checkout-order.ts', checkoutMocks)
const address = country => ({ name: 'Test', street: 'Street', city: 'City', state: 'State', zip: '12345', country })
for (const country of ['IL', 'RU', 'Israel', 'Russia', 'Russian Federation', 'il', ' ru ', 'IR', 'invalid']) {
  assert.throws(() => checkout.resolveCheckoutCustomer(undefined, 'test@example.com', address(country)), checkout.CheckoutError)
}
for (const country of ['AU', 'United Kingdom', 'Canada', 'pk']) {
  const value = address(country)
  checkout.resolveCheckoutCustomer(undefined, 'test@example.com', value)
  assert.ok(config.shippingCountries.includes(value.country))
}
// Exercise both payment endpoints without creating orders or contacting providers.
const oldStripeKey = process.env.STRIPE_SECRET_KEY
process.env.STRIPE_SECRET_KEY = 'sk_test_offline_validation'
try {
  for (const route of ['src/app/api/payments/stripe/checkout/route.ts', 'src/app/api/payments/create-order/route.ts']) {
    const handler = load(route, {
      '@/config/fulfillment': config, '@/lib/checkout-order': checkout,
      'next-auth': { getServerSession: async () => null }, '@/lib/auth-options': { authOptions: {} },
      '@/lib/mongodb': { connectDB: async () => true },
      '@/models/Order': { create: () => { throw new Error('An unavailable destination must never create an order') } },
      stripe: class Stripe {},
    })
    for (const country of ['IL', 'RU']) {
      const originalError = console.error
      let response
      try {
        console.error = () => {}
        response = await handler.POST({ json: async () => ({ items: [], email: 'test@example.com', shippingAddress: address(country) }) })
      } finally { console.error = originalError }
      assert.equal(response.status, 400)
      assert.match((await response.json()).error, /not able to ship/)
    }
  }
} finally {
  if (oldStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY
  else process.env.STRIPE_SECRET_KEY = oldStripeKey
}
const contact = load('src/app/api/contact/route.ts', {
  '@/config/fulfillment': config,
  '@/lib/email': { sendEmail: () => { throw new Error('Excluded quote must not send mail') } },
  '@/lib/notifications': {}, '@/lib/mongodb': {}, '@/models/ContactMessage': {},
})
for (const country of ['IL', 'RU', 'Israel', 'Russia']) {
  const response = await contact.POST({ json: async () => ({ name: 'Test', email: 'test@example.com', subject: 'Shipping quote', message: 'Quote please', country }) })
  assert.equal(response.status, 400)
  assert.match((await response.json()).error, /not able to ship/)
}
const { applyStripeShippingAddress } = load('src/lib/stripe-shipping-address.ts', { '@/config/fulfillment': config })
const order = { shippingAddress: address('US') }
applyStripeShippingAddress(order, { collected_information: { shipping_details: { name: 'New recipient', address: { country: 'AU', line1: 'New street', city: 'Sydney', state: 'NSW', postal_code: '2000' } } } })
assert.equal(order.shippingAddress.country, 'AU')
assert.equal(order.shippingAddress.street, 'New street')
assert.throws(() => applyStripeShippingAddress(order, { collected_information: { shipping_details: { address: { country: 'IL' } } } }), /not able to ship/)
const { GET } = load('src/app/api/visitor-country/route.ts')
const { shippingDetailsJsonLd } = load('src/lib/shipping-schema.ts', { '@/config/fulfillment': config })
assert.deepEqual(shippingDetailsJsonLd.shippingDestination.map(region => region.addressCountry), config.shippingCountries)
assert.equal(shippingDetailsJsonLd.shippingRate.value, '45.00')
assert.equal(shippingDetailsJsonLd.deliveryTime.handlingTime.minValue, 6)
assert.equal(shippingDetailsJsonLd.deliveryTime.handlingTime.maxValue, 7)
assert.equal(shippingDetailsJsonLd.deliveryTime.transitTime.minValue, 5)
assert.equal(shippingDetailsJsonLd.deliveryTime.transitTime.maxValue, 7)
assert.equal(shippingDetailsJsonLd.deliveryTime.businessDays.dayOfWeek.length, 5)
const response = GET({ headers: new Headers({ 'x-vercel-ip-country': 'RU' }) })
assert.deepEqual(await response.json(), { country: 'RU' })
assert.equal(response.headers.get('cache-control'), 'private, no-store')
assert.deepEqual(await GET({ headers: new Headers() }).json(), { country: null })
const { planDocument } = await import('./update-worldwide-shipping.mjs')
assert.equal(planDocument('blogposts', { _id: 'unrelated', title: 'Style guide', content: '<p>Popular in the United Kingdom.</p><p>Shipping is available.</p>' }), null)
assert.equal(planDocument('products', { _id: 'clean', description: 'A wool jacket.' }), null)
const proposed = planDocument('blogposts', { _id: 'shipping', title: 'Shipping guide', content: '<p>We ship to the United States, United Kingdom, and Canada.</p><p>Popular in the UK.</p>' })
assert.equal(proposed.changes.length, 1)
assert.ok(proposed.changes[0].after.includes(config.fulfillmentConfig.internationalShipping))
assert.ok(proposed.changes[0].after.includes('<p>Popular in the UK.</p>'))
const faqProposal = planDocument('faqs', { _id: 'faq', question: 'Do you ship internationally?', answer: ['Old answer'], bullets: [], ordered: [] })
assert.deepEqual(faqProposal.changes[0].after, [config.internationalShippingAnswer])
assert.equal(planDocument('faqs', { _id: 'faq', question: 'Do you ship internationally?', answer: [config.internationalShippingAnswer], bullets: [], ordered: [] }), null)
console.log(`PASS: Central cutoff (11:58 PM/12:01 AM/Saturday), holidays, DST, ${config.shippingCountries.length} shared supported countries, excluded-country messages, Stripe/PayPal server rejection, confirmed Stripe address, skeleton and shipping costs.`)
