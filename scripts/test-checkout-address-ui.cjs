const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const React = require('react')

// Exercise the real checkout component's handlers/effects without a browser or payment network.
function transpile(file) {
  return ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText
}
function load(file, mocks = {}) {
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', transpile(file))(id => id in mocks ? mocks[id] : require(id), mod, mod.exports)
  return mod.exports
}
const countries = load('src/config/shipping-countries.ts')
const fulfillment = load('src/config/fulfillment.ts', { './shipping-countries': countries })
const drafts = load('src/lib/checkout-address-draft.ts')
const nodes = tree => {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...nodes(tree.props?.children)]
}
const text = tree => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join('') : tree?.props ? text(tree.props.children) : ''

async function mount({ storage = new Map(), user = null, profile, suggestion = { country: 'US', state: 'TX', city: 'Austin', zip: '78701' }, failLocation = false, locationDelay, storageUnavailable = false } = {}) {
  let cursor = 0, slots = [], effects = [], tree, confirmationCalls = 0, locationCalls = 0
  const hookReact = { ...React,
    useState: initial => {
      const index = cursor++
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial }
      return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value }]
    },
    useRef: value => { const index = cursor++; if (!slots[index]) slots[index] = { current: value }; return slots[index] },
    useEffect: (effect, deps) => {
      const index = cursor++, previous = slots[index]
      if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
        slots[index] = { deps, cleanup: previous?.cleanup }
        effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = effect() })
      }
    },
  }
  const mocks = {
    react: hookReact,
    'next-auth/react': { useSession: () => ({ status: user ? 'authenticated' : 'unauthenticated', data: user ? { user } : null }) },
    'next/navigation': { useRouter: () => ({ push: () => {} }), useSearchParams: () => new URLSearchParams() },
    'framer-motion': { motion: { div: 'div' }, AnimatePresence: 'div' },
    '@/config/fulfillment': fulfillment,
    '@/lib/checkout-address-draft': drafts,
    '@/hooks/use-toast': { useToast: () => ({ toast: () => {} }) },
    '@/hooks/use-has-mounted': { useHasMounted: () => true },
    '@/hooks/use-guest-form-activity': { useGuestFormActivity: () => ({ bindings: {}, notice: null, submitted: async () => {} }) },
    '@/components/turnstile-challenge': { useTurnstile: () => ({ token: 'offline', reset() {}, widget: null, ready: true }) },
    '@/store/cart': { useCartStore: () => ({ items: [{ id: 'line', productId: 'product', name: 'Jacket', image: '/test.png', quantity: 2, price: 100, variants: [] }], clearCart: () => {}, clearDirectOrderItem: () => {}, clearAppliedPromo: () => {} }) },
    '@/types/jacket-customization': { getCustomizedViews: () => [] },
    '@/lib/activity': { logUserActivity: () => {} },
  }
  const source = transpile('src/app/checkout/page.tsx')
  const mod = { exports: {} }
  const componentStub = new Proxy({ __esModule: true, default: 'div' }, { get: (target, name) => name in target ? target[name] : 'div' })
  new Function('require', 'module', 'exports', source + '\nexports.CheckoutContent = CheckoutContent;')(id => {
    if (id in mocks) return mocks[id]
    if (id.startsWith('@/')) return componentStub
    return require(id)
  }, mod, mod.exports)
  const savedWindow = global.window, savedStorage = global.sessionStorage, savedFetch = global.fetch
  global.window = { setTimeout: () => 1 }
  global.sessionStorage = { getItem: key => { if (storageUnavailable) throw new Error('Storage blocked'); return storage.get(key) || null },
    setItem: (key, value) => { if (storageUnavailable) throw new Error('Storage blocked'); storage.set(key, value) } }
  global.fetch = async (url, options) => {
    if (url === '/api/checkout/location') { locationCalls++; if (locationDelay) await locationDelay(); if (failLocation) throw new Error('Offline'); return { ok: true, json: async () => ({ suggestion }) } }
    if (url === '/api/users/profile') return { ok: true, json: async () => profile || { ...user, addresses: [] } }
    if (url === '/api/payments/config') return { ok: true, json: async () => ({ activeGateway: 'stripe', stripePublishableKey: 'offline' }) }
    assert.equal(url, '/api/checkout/address/confirm')
    confirmationCalls++
    const body = JSON.parse(options.body)
    assert.equal(body.confirmed, true)
    return { ok: true, json: async () => ({ shippingAddress: body.shippingAddress, email: user?.email || body.email, token: 'offline-proof', expiresAt: Date.now() + 100000 }) }
  }
  const render = () => { cursor = 0; tree = mod.exports.CheckoutContent(); return tree }
  const settle = async () => {
    for (let i = 0; i < 5; i++) { render(); const pending = effects; effects = []; pending.forEach(effect => effect()); await new Promise(setImmediate) }
  }
  const find = predicate => { const node = nodes(tree).find(predicate); assert.ok(node, 'Expected checkout control'); return node }
  const click = async label => { await find(node => typeof node.props?.onClick === 'function' && text(node).trim() === label).props.onClick(); await settle() }
  const value = id => find(node => node.props?.id === id).props.value
  const change = async (id, value) => {
    find(node => node.type === 'fieldset').props.onChangeCapture()
    find(node => node.props?.id === id).props.onChange({ target: { value } })
    await settle()
  }
  await settle()
  return { storage, value, change, click, settle,
    autofill: (id, value) => { find(node => node.props?.id === id).props.ref.current = { value } },
    calls: () => ({ confirmationCalls, locationCalls }),
    close: () => { slots.forEach(slot => slot?.cleanup?.()); global.window = savedWindow; global.sessionStorage = savedStorage; global.fetch = savedFetch } }
}

async function main() {
  let app = await mount()
  let storage
  try {
    assert.equal(app.value('shippingCity'), 'Austin')
    assert.equal(app.value('shippingStreet'), '')
    for (const [id, value] of [['shippingName', 'Buyer'], ['shippingEmail', 'buyer@example.com'], ['shippingStreet', '123 Main St']]) await app.change(id, value)
    await app.click('Review Order details')
    await app.click('Confirm delivery address and continue')
    assert.equal(app.calls().confirmationCalls, 1)
    await app.click('Back to Review')
    await app.click('Continue to payment')
    assert.equal(app.calls().confirmationCalls, 1)
    storage = app.storage
  } finally { app.close() }
  // A hosted payment cancellation or reload restores all entries and confirmation.
  app = await mount({ storage })
  try {
    assert.equal(app.value('shippingStreet'), '123 Main St')
    assert.equal(app.calls().locationCalls, 0)
    await app.click('Review Order details')
    await app.click('Continue to payment')
    assert.equal(app.calls().confirmationCalls, 0)
    await app.click('Back to Review')
    await app.click('Edit delivery address')
    // Browser autofill can change the DOM value without firing React's change handler.
    app.autofill('shippingStreet', '456 New St')
    await app.click('Review Order details')
    await app.click('Confirm delivery address and continue')
    assert.equal(app.calls().confirmationCalls, 1)
  } finally { app.close() }
  const user = { id: 'customer-1', name: 'Customer', email: 'customer@example.com' }
  const saved = { name: 'Recipient', street: 'Saved Road', city: 'London', state: 'England', zip: 'SW1A 1AA', country: 'GB', isDefault: true }
  app = await mount({ storage, user, profile: { ...user, addresses: [saved] } })
  try {
    assert.equal(app.value('shippingStreet'), 'Saved Road')
    assert.equal(app.value('shippingCity'), 'London')
    assert.equal(app.calls().locationCalls, 0)
    await app.change('shippingStreet', 'Customer edited road')
  } finally { app.close() }
  app = await mount({ storage, user, profile: { ...user, addresses: [saved] } })
  try {
    assert.equal(app.value('shippingStreet'), 'Customer edited road')
    await app.click('Use a new address')
    assert.equal(app.value('shippingCity'), 'Austin')
    assert.equal(app.value('shippingStreet'), '')
  } finally { app.close() }
  let release
  const delayed = new Promise(resolve => { release = resolve })
  app = await mount({ user, profile: { ...user, addresses: [saved] }, locationDelay: () => delayed })
  try {
    await app.click('Use a new address')
    await app.change('shippingStreet', 'Typed while location was loading')
    release(); await app.settle()
    assert.equal(app.value('shippingStreet'), 'Typed while location was loading')
    assert.equal(app.value('shippingCountry'), '')
  } finally { app.close() }
  app = await mount({ failLocation: true })
  try { assert.equal(app.value('shippingCountry'), ''); await app.change('shippingStreet', 'Manual entry works') } finally { app.close() }
  app = await mount({ storageUnavailable: true })
  try {
    await app.change('shippingName', 'Buyer'); await app.change('shippingEmail', 'buyer@example.com'); await app.change('shippingStreet', '123 Main St')
    await app.click('Review Order details'); await app.click('Confirm delivery address and continue')
    assert.equal(app.calls().confirmationCalls, 1)
  } finally { app.close() }
  console.log('Checkout address UI flow checks passed: suggestions, confirmation, edits, reloads, saved addresses and fallback')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
