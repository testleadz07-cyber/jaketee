import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import React from 'react'
import ts from 'typescript'
import { loadTypeScript } from './lib/load-typescript.mjs'

const require = createRequire(import.meta.url)
function load(file, mocks) {
  const compiled = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  new Function('require', 'module', 'exports', source)(id => id in mocks ? mocks[id] : require(id), compiled, compiled.exports)
  return compiled.exports
}
const helpers = loadTypeScript('src/lib/product-variants.ts')
const product = {
  _id: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439011', name: 'Varsity jacket with patches', slug: 'varsity-jacket-with-patches',
  category: { name: 'Varsity Jackets', slug: 'varsity-jackets' }, description: 'Test jacket',
  price: 100, inStock: true, stockCount: 100, status: 'active', images: [], variants: [],
}
assert.deepEqual(helpers.getProductVariants(product).map(option => option.value), helpers.DEFAULT_APPAREL_SIZES)
assert.equal(helpers.getDefaultProductVariants(helpers.getProductVariants(product)).Size, 'M')
assert.equal(helpers.getDefaultProductVariants([{ name: 'Size', value: 'M', priceAdjust: 0, inStock: false }]).Size, undefined)
assert.equal(helpers.getProductVariants({ ...product, name: 'Letterman Patch Packs', slug: 'letterman-patch-packs' })[0].value, 'One size')
const configured = [{ name: 'Size', value: 'M', priceAdjust: 5, inStock: true }, { name: 'Size', value: 'XL', priceAdjust: 10, inStock: false }]
assert.deepEqual(helpers.getProductVariants({ ...product, variants: configured }), configured)

let storedProduct = product
const checkoutSource = fs.readFileSync('src/lib/checkout-order.ts', 'utf8')
const checkoutMocks = Object.fromEntries([...checkoutSource.matchAll(/from '(@\/[^']+)'/g)].map(match => [match[1], {}]))
checkoutMocks['@/lib/product-variants'] = helpers
checkoutMocks['@/lib/garment-template'] = { getGarmentCategory: () => null }
checkoutMocks['@/models/Product'] = { findById: () => ({ lean: async () => storedProduct }) }
const { resolveCheckoutItems } = load('src/lib/checkout-order.ts', checkoutMocks)
const item = (variants, price = 100) => [{ productId: product.id, quantity: 1, price, variants }]
await assert.rejects(resolveCheckoutItems(item([])), /choose an available size/)
await assert.rejects(resolveCheckoutItems(item([{ name: 'Standard', value: 'Default' }])), /choose an available size/)
await assert.rejects(resolveCheckoutItems(item([{ name: 'Size', value: '99XL' }])), /unavailable/)
assert.deepEqual((await resolveCheckoutItems(item([{ name: 'Size', value: 'L' }])))[0].variants, [{ name: 'Size', value: 'L' }])
storedProduct = { ...product, variants: configured }
await assert.rejects(resolveCheckoutItems(item([{ name: 'Size', value: 'XL' }], 110)), /unavailable/)
const priced = await resolveCheckoutItems(item([{ name: 'Size', value: 'M' }], 105))
assert.equal(priced[0].price, 105)

// Exercise the actual product component's handlers with a small hook harness.
// Other storefront services are stubbed; no network, storage or orders are used.
let state = [], cursor = 0, cartItem, directItem, destination
const fakeReact = { ...React, useEffect: () => {}, useRef(initial) {
  const index = cursor++
  if (!(index in state)) state[index] = { current: initial }
  return state[index]
}, useState(initial) {
  const index = cursor++
  if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial
  return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value }]
} }
const noop = () => null
const Button = props => React.createElement('button', props)
const source = fs.readFileSync('src/components/product-detail-view.tsx', 'utf8')
const uiMocks = Object.fromEntries([...source.matchAll(/from '(@\/components\/[^']+)'/g)].map(match => [match[1], new Proxy({}, { get: () => noop })]))
const component = load('src/components/product-detail-view.tsx', {
  ...uiMocks, react: fakeReact, 'next-auth/react': { useSession: () => ({ data: null }) },
  'framer-motion': { motion: { div: 'div' }, AnimatePresence: React.Fragment },
  'next/navigation': { useRouter: () => ({ push: value => { destination = value } }) },
  '@/components/ui/button': { Button },
  '@/store/cart': { useCartStore: selector => selector({ addItem: item => { cartItem = item }, setDirectOrderItem: item => { directItem = item } }) },
  '@/store/wishlist': { useWishlistStore: selector => selector({ isInWishlist: () => false, addItem: noop, removeItem: noop }) },
  '@/store/recently-viewed': { useRecentlyViewedStore: selector => selector({ addItem: noop }) },
  '@/lib/categories': loadTypeScript('src/lib/categories.ts'), '@/lib/activity': { logUserActivity: noop },
  '@/lib/pricing': { getDisplayCompareAtPrice: () => null }, '@/lib/product-faqs': { buildProductFaqs: () => [] },
  '@/lib/product-variants': helpers,
}).ProductDetailView
function flatten(element) {
  if (Array.isArray(element)) return element.flatMap(flatten)
  if (!element || typeof element !== 'object') return []
  return [element, ...flatten(element.props?.children)]
}
function text(element) {
  if (Array.isArray(element)) return element.map(text).join('')
  if (!element || typeof element === 'boolean') return ''
  return typeof element === 'object' ? text(element.props?.children) : String(element)
}
function render(fixture) { cursor = 0; return flatten(component({ slug: fixture.slug, initialProduct: fixture })) }
const noMedium = { ...product, variants: [{ name: 'Size', value: 'L', priceAdjust: 0, inStock: true }, { name: 'Size', value: 'XL', priceAdjust: 0, inStock: true }] }
for (const fixture of [noMedium, { ...noMedium, category: { name: 'Leather Vests', slug: 'leather-vests' } }]) {
  state = []; cartItem = directItem = destination = undefined
  let elements = render(fixture)
  let add = elements.find(element => element.type === Button && text(element).includes('Add to Cart'))
  assert.equal(add.props.disabled, false)
  let focused = 0, scrolled = 0
  const group = elements.find(element => element.props?.role === 'group' && element.props['aria-label'] === 'Size')
  group.props.ref.current = {
    scrollIntoView: () => { scrolled++ },
    querySelector: selector => {
      assert.equal(selector, 'button[aria-pressed]:not(:disabled)')
      return { focus: options => { assert.equal(options.preventScroll, true); focused++ } }
    },
  }
  const buy = elements.find(element => element.type === Button && text(element).includes('Buy Now'))
  assert.equal(buy.props.disabled, false)
  for (const action of [add, buy]) {
    action.props.onClick()
    assert.equal(cartItem, undefined)
    assert.equal(directItem, undefined)
    assert.equal(destination, undefined)
    elements = render(fixture)
    assert.ok(elements.some(element => element.props?.role === 'alert' && text(element) === 'Please select a size to continue'))
    const highlighted = elements.find(element => element.props?.role === 'group' && element.props['aria-label'] === 'Size')
    assert.ok(highlighted.props.className.includes('border-red-600'))
    assert.equal(highlighted.props['aria-describedby'], 'product-size-error')
  }
  assert.equal(focused, 2)
  assert.equal(scrolled, 2)
  const mobileOptions = elements.find(element => element.type === Button && text(element).includes('Choose options'))
  assert.equal(mobileOptions.props.disabled, false)
  mobileOptions.props.onClick()
  assert.equal(focused, 3)
  assert.equal(scrolled, 3)
  assert.equal(cartItem, undefined)
  assert.equal(destination, undefined)
  const size = elements.find(element => element.props?.['aria-label'] === 'Size: L')
  assert.ok(size)
  size.props.onClick()
  elements = render(fixture)
  assert.ok(!elements.some(element => element.props?.id === 'product-size-error'))
  assert.ok(!elements.find(element => element.props?.role === 'group' && element.props['aria-label'] === 'Size').props.className)
  assert.equal(elements.find(element => element.props?.['aria-label'] === 'Size: L').props['aria-pressed'], true)
  add = elements.find(element => element.type === Button && text(element).includes('Add to Cart'))
  assert.equal(add.props.disabled, false)
  add.props.onClick()
  assert.ok(cartItem.variants.some(option => option.name === 'Size' && option.value === 'L'))
  elements.find(element => element.type === Button && text(element).includes('Buy Now')).props.onClick()
  assert.ok(directItem.variants.some(option => option.name === 'Size' && option.value === 'L'))
  assert.equal(destination, '/checkout?mode=buy-now')
}
state = []
let defaultElements = render(product)
assert.equal(defaultElements.find(element => element.props?.['aria-label'] === 'Size: M').props['aria-pressed'], true)
defaultElements.find(element => element.type === Button && text(element).includes('Add to Cart')).props.onClick()
assert.ok(cartItem.variants.some(option => option.name === 'Size' && option.value === 'M'))
state = []
const soldOut = render({ ...product, inStock: false })
for (const label of ['Add to Cart', 'Buy Now']) {
  assert.equal(soldOut.find(element => element.type === Button && text(element).includes(label))?.props.disabled ?? true, true)
}
const CustomizerStub = () => null
const customizeSource = fs.readFileSync('src/components/customize-product-view.tsx', 'utf8')
const customizeMocks = Object.fromEntries([...customizeSource.matchAll(/from '(@\/components\/[^']+)'/g)].map(match => [match[1], new Proxy({}, { get: () => noop })]))
const CustomizeProductView = load('src/components/customize-product-view.tsx', {
  ...customizeMocks,
  react: fakeReact,
  'next/dynamic': () => CustomizerStub,
  'next-auth/react': { useSession: () => ({ data: null }) },
  'next/navigation': { useRouter: () => ({ push: value => { destination = value } }) },
  '@/store/cart': { useCartStore: selector => selector({ addItem: item => { cartItem = item }, setDirectOrderItem: item => { directItem = item } }) },
  '@/store/wishlist': { useWishlistStore: selector => selector({ isInWishlist: () => false, addItem: noop, removeItem: noop }) },
  '@/lib/categories': loadTypeScript('src/lib/categories.ts'),
  '@/lib/activity': { logUserActivity: noop },
  '@/lib/product-variants': helpers,
  '@/hooks/use-customization-insights': { useCustomizationInsights: () => new Proxy({}, { get: () => noop }) },
}).CustomizeProductView
state = []; cursor = 0; cartItem = directItem = destination = undefined
const customElements = flatten(CustomizeProductView({ product }))
const customizer = customElements.find(element => element.type === CustomizerStub)
assert.ok(customizer)
assert.equal(customizer.props.selectedVariants.Size, 'M')
assert.ok(customizer.props.product.variants.some(variant => variant.name === 'Size' && variant.value === 'M'))
customizer.props.onAddToCart()
assert.ok(cartItem.variants.some(option => option.name === 'Size' && option.value === 'M'))
storedProduct = product
await resolveCheckoutItems([cartItem])
customizer.props.onBuyNow()
assert.ok(directItem.variants.some(option => option.name === 'Size' && option.value === 'M'))
await resolveCheckoutItems([{ ...directItem, quantity: 1 }])
assert.equal(destination, '/checkout?mode=buy-now')
console.log('PASS: Medium is selected on product and custom-design pages; custom cart and Buy Now items pass server size validation.')
console.log('PASS: clickable purchase buttons, missing-size message/highlight/focus, no cart or checkout before selection, sold-out protection, valid size purchase and server validation.')
