const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

// Run the real TypeScript validators with isolated database records, without writes or payments.
const cache = new Map()
let product, coupon, customer
const productId = '507f1f77bcf86cd799439011'
const mocks = {
  '@/models/Product': { default: { findById: () => ({ lean: async () => product }) } },
  '@/models/Discount': { default: { findOne: query => ({ lean: async () => coupon?.code === query.code && coupon.isActive ? coupon : null }) } },
  '@/models/User': { default: { findById: () => ({ select: () => ({ lean: async () => customer }) }) } },
}
function load(file) {
  file = path.resolve(file)
  if (cache.has(file)) return cache.get(file).exports
  const mod = { exports: {} }
  cache.set(file, mod)
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  new Function('require', 'module', 'exports', source)(id => {
    if (id === '@/lib/mongodb' && file.includes(`${path.sep}models${path.sep}`)) return { requestScopedModel: model => model }
    if (mocks[id]) return { __esModule: true, ...mocks[id] }
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`)
    if (id.startsWith('.')) return load(path.resolve(path.dirname(file), `${id}.ts`))
    return require(id)
  }, mod, mod.exports)
  return mod.exports
}
const config = load('src/config/fulfillment.ts')
const checkout = load('src/lib/checkout-order.ts')
const confirmation = load('src/lib/address-confirmation.ts')
const address = () => ({ name: ' Buyer ', street: '123 Main St', city: 'Austin', state: 'TX', zip: '78701', country: 'US' })
const item = (quantity = 1) => ({ productId, quantity, price: 100, variants: [{ name: 'Size', value: 'M' }] })
const invalid = async fn => assert.rejects(fn, checkout.CheckoutError)

async function main() {
  process.env.NEXTAUTH_SECRET = 'offline-checkout-test-secret'
  const draft = load('src/lib/checkout-address-draft.ts')
  const suggestion = { country: 'US', state: 'TX', city: 'Austin', zip: '78701' }
  const suggested = draft.suggestCheckoutLocation(draft.EMPTY_CHECKOUT_ADDRESS, suggestion)
  assert.equal(suggested.city, 'Austin')
  assert.equal(suggested.street, '')
  for (const field of ['street', 'country', 'city', 'state', 'zip']) {
    const entered = { ...draft.EMPTY_CHECKOUT_ADDRESS, [field]: 'Existing value' }
    assert.equal(draft.suggestCheckoutLocation(entered, suggestion), entered)
  }
  assert.equal(draft.suggestCheckoutLocation(draft.EMPTY_CHECKOUT_ADDRESS, null), draft.EMPTY_CHECKOUT_ADDRESS)
  const draftNow = Date.now()
  const draftValue = { address: { ...suggested, name: 'Buyer', email: 'buyer@example.com' },
    confirmation: { token: 'test', expiresAt: draftNow + 10000 }, updatedAt: draftNow, suggested: true }
  assert.deepEqual(draft.readCheckoutAddressDraft(JSON.stringify(draftValue), draftNow).address, draftValue.address)
  assert.equal(draft.readCheckoutAddressDraft(JSON.stringify(draftValue), draftNow + 10001).confirmation, null)
  assert.equal(draft.readCheckoutAddressDraft(JSON.stringify(draftValue), draftNow + 86400001), null)
  assert.equal(draft.readCheckoutAddressDraft('{invalid'), null)
  assert.notEqual(draft.checkoutAddressKey('guest'), draft.checkoutAddressKey(`user:${productId}`))

  const geo = load('src/lib/geo.ts')
  const location = load('src/app/api/checkout/location/route.ts')
  const geoEnvKeys = ['ACTIVITY_GEO_PROVIDER', 'VERCEL', 'NETLIFY']
  const originalGeoEnv = geoEnvKeys.map(key => process.env[key])
  try {
    delete process.env.VERCEL; delete process.env.NETLIFY; delete process.env.ACTIVITY_GEO_PROVIDER
    const request = { headers: new Headers({ 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'TX',
      'x-vercel-ip-city': 'San%20Antonio', 'x-vercel-ip-postal-code': '78201' }) }
    // Platform headers work without Vercel/Netlify environment flags.
    assert.equal(geo.getGeoFromRequest(request).country, 'US')
    assert.deepEqual((await location.GET(request).json()).suggestion, { country: 'US', state: 'TX', city: 'San Antonio', zip: '78201' })
    assert.equal(location.GET(request).headers.get('cache-control'), 'private, no-store')
    request.headers.set('cf-ipcountry', 'CA')
    assert.equal((await location.GET(request).json()).suggestion.country, 'CA')
    request.headers.delete('cf-ipcountry')
    request.headers.set('x-vercel-ip-country', 'IL')
    assert.equal((await location.GET(request).json()).suggestion, null)
    assert.equal((await location.GET({ headers: new Headers() }).json()).suggestion, null)
    request.headers.set('x-vercel-ip-country', 'US')
    request.headers.set('x-vercel-ip-city', '%00bad')
    request.headers.set('x-vercel-ip-postal-code', 'x'.repeat(201))
    const partial = (await location.GET(request).json()).suggestion
    assert.equal(partial.city, '')
    assert.equal(partial.zip, '')
  } finally {
    geoEnvKeys.forEach((key, i) => { if (originalGeoEnv[i] === undefined) delete process.env[key]; else process.env[key] = originalGeoEnv[i] })
  }

  const proof = confirmation.issueAddressConfirmation(address(), 'buyer@example.com', undefined, draftNow)
  assert.equal(confirmation.verifyAddressConfirmation(proof.token, address(), 'buyer@example.com', undefined, draftNow).getTime(), draftNow)
  for (const field of ['name', 'street', 'city', 'state', 'zip', 'country', 'phone']) {
    assert.throws(() => confirmation.verifyAddressConfirmation(proof.token, { ...address(), [field]: 'changed' }, 'buyer@example.com', undefined, draftNow), checkout.CheckoutError)
  }
  for (const token of [undefined, '', true, proof.token + 'x', proof.token + '.extra']) {
    assert.throws(() => confirmation.verifyAddressConfirmation(token, address(), 'buyer@example.com', undefined, draftNow), checkout.CheckoutError)
  }
  assert.throws(() => confirmation.verifyAddressConfirmation(proof.token, address(), 'other@example.com', undefined, draftNow), checkout.CheckoutError)
  assert.throws(() => confirmation.verifyAddressConfirmation(proof.token, address(), 'buyer@example.com', productId, draftNow), checkout.CheckoutError)
  assert.throws(() => confirmation.verifyAddressConfirmation(proof.token, address(), 'buyer@example.com', undefined, proof.expiresAt), checkout.CheckoutError)
  for (const [count, expected] of [[1, 45], [2, 65], [3, 85], [10, 225]]) {
    assert.equal(config.calculateShipping(count), expected)
    assert.equal(config.calculateShipping(count, true), 0)
  }
  for (const count of [0, -1, 1.5, NaN, Infinity, '2']) assert.throws(() => config.calculateShipping(count))

  const guest = await checkout.resolveCheckoutCustomer(undefined, 'BUYER@example.com', address())
  assert.equal(guest.userEmail, 'buyer@example.com')
  assert.equal(guest.userName, 'Buyer')
  for (const field of ['name', 'street', 'city', 'state', 'zip', 'country']) {
    await invalid(() => checkout.resolveCheckoutCustomer(undefined, 'buyer@example.com', { ...address(), [field]: ' ' }))
  }
  for (const country of ['IL', 'RU', 'invalid']) await invalid(() => checkout.resolveCheckoutCustomer(undefined, 'buyer@example.com', { ...address(), country }))
  await invalid(() => checkout.resolveCheckoutCustomer(undefined, 'invalid', address()))
  await invalid(() => checkout.resolveCheckoutCustomer(undefined, 'buyer@example.com', { ...address(), phone: {} }))
  customer = { email: 'db@example.com', name: 'Database Buyer', isActive: true }
  const account = await checkout.resolveCheckoutCustomer({ id: productId, email: 'stale@example.com' }, 'spoof@example.com', address())
  assert.equal(account.userEmail, 'db@example.com')
  customer.isActive = false
  await invalid(() => checkout.resolveCheckoutCustomer({ id: productId }, 'buyer@example.com', address()))

  product = { _id: productId, name: 'Database Jacket', price: 100, status: 'active', inStock: true, stockCount: 4, variants: [{ name: 'Size', value: 'M', inStock: true, priceAdjust: 0 }] }
  const lines = await checkout.resolveCheckoutItems([item(2), item(2)])
  assert.equal(lines.length, 2)
  assert.equal(lines.reduce((n, line) => n + line.quantity, 0), 4)
  assert.equal(config.calculateShipping(4), 105)
  await invalid(() => checkout.resolveCheckoutItems([item(3), item(2)]))
  for (const quantity of [0, -1, 1.5, '2', NaN, 1001]) await invalid(() => checkout.resolveCheckoutItems([item(quantity)]))
  for (const price of [0, 99, '100', undefined, NaN]) await invalid(() => checkout.resolveCheckoutItems([{ ...item(), price }]))
  for (const raw of [[], null, [null], [{ ...item(), productId: 'invalid' }]]) await invalid(() => checkout.resolveCheckoutItems(raw))
  await invalid(() => checkout.resolveCheckoutItems([{ ...item(), variants: [] }]))
  await invalid(() => checkout.resolveCheckoutItems([{ ...item(), variants: [{ name: 'Size', value: 'XXL' }] }]))
  product.status = 'inactive'
  await invalid(() => checkout.resolveCheckoutItems([item()]))
  product.status = 'active'
  product.variants[0].inStock = false
  await invalid(() => checkout.resolveCheckoutItems([item()]))

  coupon = { code: 'FREE', discountType: 'free_shipping', isActive: true, minOrderValue: 50, usageCount: 0 }
  assert.equal((await checkout.resolveCheckoutDiscount('free', 100)).freeShipping, true)
  await invalid(() => checkout.resolveCheckoutDiscount('FREE', 49))
  coupon.endDate = new Date(0)
  await invalid(() => checkout.resolveCheckoutDiscount('FREE', 100))
  delete coupon.endDate
  coupon.usageLimit = 0
  await invalid(() => checkout.resolveCheckoutDiscount('FREE', 100))
  delete coupon.usageLimit
  coupon.isActive = false
  await invalid(() => checkout.resolveCheckoutDiscount('FREE', 100))

  // Custom made-to-order designs use server configuration rather than a Product document.
  const varsity = load('src/lib/varsity-template.ts')
  const garments = load('src/lib/garment-template.ts')
  const custom = {
    productId: varsity.VARSITY_TEMPLATE_ID, quantity: 2,
    price: varsity.getVarsityPrice(varsity.DEFAULT_VARSITY_OPTIONS),
    customization: { varsityOptions: varsity.DEFAULT_VARSITY_OPTIONS },
  }
  const bomberOptions = garments.getGarmentDefaults('bomber')
  const bomber = { productId: garments.getGarmentTemplateId('bomber'), quantity: 3,
    price: garments.getGarmentPrice('bomber', bomberOptions),
    customization: { garmentCategory: 'bomber', garmentOptions: bomberOptions } }
  assert.deepEqual((await checkout.resolveCheckoutItems([custom, bomber])).map(line => line.quantity), [2, 3])
  await invalid(() => checkout.resolveCheckoutItems([{ ...custom, price: 0 }]))
  await invalid(() => checkout.resolveCheckoutItems([{ ...bomber, customization: { garmentCategory: 'bomber', garmentOptions: { ...bomberOptions, Size: 'invalid' } } }]))

  let savedOrder, stripePayload, paypalPayload, signedIn = false
  mocks['next-auth'] = { getServerSession: async () => signedIn ? { user: { id: productId, email: 'stale@example.com' } } : null }
  mocks['@/lib/auth-options'] = { authOptions: {} }
  mocks['@/lib/mongodb'] = { connectDB: async () => true }
  mocks['@/models/Order'] = { default: { create: async data => {
    savedOrder = data
    return { ...data, _id: productId, save: async () => {} }
  } } }
  mocks.stripe = { default: class {
    checkout = { sessions: { create: async data => { stripePayload = data; return { id: 'test_session', url: 'https://example.com/pay' } } } }
  } }
  const stripeHandler = load('src/app/api/payments/stripe/checkout/route.ts').POST
  const paypalHandler = load('src/app/api/payments/create-order/route.ts').POST
  const confirmHandler = load('src/app/api/checkout/address/confirm/route.ts').POST
  const originalFetch = global.fetch
  const envKeys = ['STRIPE_SECRET_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']
  const oldEnv = envKeys.map(key => process.env[key])
  try {
    process.env.STRIPE_SECRET_KEY = 'sk_test_offline'
    process.env.PAYPAL_CLIENT_ID = 'offline'
    process.env.PAYPAL_CLIENT_SECRET = 'offline'
    global.fetch = async (url, options) => {
      if (url.endsWith('/v1/oauth2/token')) return { ok: true, json: async () => ({ access_token: 'offline' }) }
      assert.ok(url.endsWith('/v2/checkout/orders'))
      paypalPayload = JSON.parse(options.body)
      return { ok: true, json: async () => ({ id: 'offline_order' }) }
    }
    product.stockCount = 4
    product.variants[0].inStock = true
    customer.isActive = true
    coupon.isActive = true
    for (const authenticated of [false, true]) {
      signedIn = authenticated
      const request = body => ({ headers: new Headers({ host: 'shop.example.com', origin: 'https://shop.example.com' }),
        nextUrl: new URL('https://shop.example.com'), json: async () => body })
      const response = await confirmHandler(request({ confirmed: true, email: 'guest@example.com', shippingAddress: address() }))
      assert.equal(response.status, 200)
      const confirmed = await response.json()
      assert.equal(confirmed.shippingAddress.name, 'Buyer')
      assert.equal(confirmed.email, authenticated ? 'db@example.com' : 'guest@example.com')
      confirmation.verifyAddressConfirmation(confirmed.token, confirmed.shippingAddress, confirmed.email, authenticated ? productId : undefined)
      assert.equal((await confirmHandler(request({ confirmed: false, email: 'guest@example.com', shippingAddress: address() }))).status, 400)
      assert.equal((await confirmHandler(request({ confirmed: true, email: 'guest@example.com', shippingAddress: { ...address(), street: '' } }))).status, 400)
      const crossOrigin = request({ confirmed: true })
      crossOrigin.headers.set('origin', 'https://other.example.com')
      assert.equal((await confirmHandler(crossOrigin)).status, 403)
    }
    for (const authenticated of [false, true]) {
      signedIn = authenticated
      for (const handler of [stripeHandler, paypalHandler]) {
        for (const free of [false, true]) {
          savedOrder = stripePayload = paypalPayload = undefined
          // Forged client shipping/totals must be ignored by both providers.
          const body = { items: [item(2), item()], shippingAddress: address(), email: 'guest@example.com',
            checkoutMode: authenticated ? 'cart' : 'buy-now',
            shipping: 0, total: 1, subtotal: 1, promoCode: free ? 'FREE' : undefined }
          body.addressConfirmationToken = confirmation.issueAddressConfirmation(body.shippingAddress,
            authenticated ? 'db@example.com' : body.email, authenticated ? productId : undefined).token
          const response = await handler({ json: async () => body })
          assert.equal(response.status, 200)
          assert.equal(savedOrder.shipping, free ? 0 : 85)
          assert.ok(savedOrder.shippingAddressConfirmedAt instanceof Date)
          assert.equal(savedOrder.total, free ? 300 : 385)
          assert.equal(savedOrder.userEmail, authenticated ? 'db@example.com' : 'guest@example.com')
          if (stripePayload) {
            assert.equal(stripePayload.shipping_address_collection, undefined)
            assert.equal(stripePayload.billing_address_collection, 'auto')
            assert.ok(stripePayload.cancel_url.endsWith(authenticated ? '/checkout' : '/checkout?mode=buy-now'))
            assert.deepEqual(stripePayload.line_items.map(line => line.quantity), [2, 1])
            assert.equal(stripePayload.shipping_options?.[0]?.shipping_rate_data.fixed_amount.amount || 0, free ? 0 : 8500)
          } else {
            assert.equal(paypalPayload.purchase_units[0].amount.value, free ? '300.00' : '385.00')
            assert.equal(paypalPayload.application_context.shipping_preference, 'SET_PROVIDED_ADDRESS')
            assert.equal(paypalPayload.purchase_units[0].shipping.address.address_line_1, '123 Main St')
            assert.equal(paypalPayload.purchase_units[0].shipping.address.country_code, 'US')
          }
        }
        for (const badItems of [[item(5)], [{ ...item(), price: 1 }], [item(0)]]) {
          savedOrder = undefined
          const oldError = console.error
          let response
          try {
            console.error = () => {}
            response = await handler({ json: async () => ({ items: badItems, shippingAddress: address(), email: 'guest@example.com',
              addressConfirmationToken: confirmation.issueAddressConfirmation(address(), authenticated ? 'db@example.com' : 'guest@example.com', authenticated ? productId : undefined).token }) })
          } finally { console.error = oldError }
          assert.ok(response.status >= 400 && response.status < 500)
          assert.equal(savedOrder, undefined)
        }
        for (const invalidProof of [undefined, 'forged', confirmation.issueAddressConfirmation({ ...address(), street: 'Different street' },
          authenticated ? 'db@example.com' : 'guest@example.com', authenticated ? productId : undefined).token]) {
          savedOrder = undefined
          const oldError = console.error
          let response
          try {
            console.error = () => {}
            response = await handler({ json: async () => ({ items: [item()], shippingAddress: address(), email: 'guest@example.com', addressConfirmationToken: invalidProof }) })
          } finally { console.error = oldError }
          assert.equal(response.status, 409)
          assert.equal(savedOrder, undefined)
        }
      }
    }
  } finally {
    global.fetch = originalFetch
    envKeys.forEach((key, i) => { if (oldEnv[i] === undefined) delete process.env[key]; else process.env[key] = oldEnv[i] })
  }
  console.log('Checkout shipping and backend validation checks passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
