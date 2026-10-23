/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToString } = require('react-dom/server')
const cache = new Map()
const memory = new Map()
const listeners = new Map()
const calls = []
let resets = 0
const storage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) }
const windowMock = {
  localStorage: storage, location: { origin: 'https://www.jacketee.com', href: 'https://www.jacketee.com/shop?email=private@example.com' },
  addEventListener: (name, listener) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(listener) },
  removeEventListener: (name, listener) => listeners.get(name)?.delete(listener),
  dispatchEvent: event => { for (const listener of listeners.get(event.type) || []) listener(event) },
}
class CustomEventMock { constructor(type, options = {}) { this.type = type; this.detail = options.detail } }
const slots = []
let cursor = 0
let dirty = false
let pending = []
const hookReact = {
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { if (slots[index] !== value) { slots[index] = value; dirty = true } }] },
  useEffect(effect, deps) { const index = cursor++; const previous = slots[index]; if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) { slots[index] = { deps, cleanup: previous?.cleanup }; pending.push(() => { slots[index].cleanup?.(); slots[index].cleanup = effect() }) } },
}
const mocks = {
  'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  'next/script': { __esModule: true, default: () => null },
  'next/navigation': { usePathname: () => '/shop' },
  '@/components/header': { Header: () => null }, '@/components/footer': { Footer: () => null },
  '@/lib/activity-transport': { resetGuestActivityIdentity: async () => { resets++ } },
}
function load(file) {
  if (cache.has(file)) return cache.get(file)
  const exports = {}; cache.set(file, exports)
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, process, console, window: windowMock, document: { title: 'Shop jackets' }, CustomEvent: CustomEventMock,
    Event: CustomEventMock, crypto: require('node:crypto').webcrypto,
    require(id) {
      if (id === 'react' && file.endsWith('google-analytics.tsx')) return hookReact
      if (id in mocks) return mocks[id]
      if (!id.startsWith('@/') && !id.startsWith('.')) return require(id)
      const base = id.startsWith('@/') ? `src/${id.slice(2)}` : path.resolve(path.dirname(file), id)
      return load(base + (fs.existsSync(`${base}.tsx`) ? '.tsx' : '.ts'))
    },
  }, { filename: file })
  return exports
}
function renderAnalytics(Component) {
  let output
  for (let iteration = 0; iteration < 8; iteration++) {
    cursor = 0; dirty = false; output = Component()
    const effects = pending; pending = []; effects.forEach(effect => effect())
    if (!dirty) return output
  }
  throw Error('Analytics did not settle')
}
async function main() {
  const consent = load('src/lib/cookie-consent.ts')
  storage.setItem(consent.COOKIE_CONSENT_KEY, JSON.stringify({ functional: 'false', analytics: 'true' }))
  assert.equal(consent.getStoredConsent().functional, false, 'Malformed string values must not grant consent')
  assert.equal(consent.getStoredConsent().analytics, false)
  storage.removeItem(consent.COOKIE_CONSENT_KEY)
  const adapter = load('src/lib/functional-storage.ts').createFunctionalStorage()
  storage.setItem('wishlist-storage', JSON.stringify({ state: { items: ['old'] } }))
  assert.equal(adapter.getItem('wishlist-storage'), null)
  assert.equal(storage.getItem('wishlist-storage'), null, 'No-consent hydration removes legacy optional data')
  adapter.setItem('wishlist-storage', { state: { items: ['test'] } })
  assert.equal(storage.getItem('wishlist-storage'), null)
  consent.saveConsent({ functional: true, analytics: false, marketing: false })
  adapter.setItem('wishlist-storage', { state: { items: ['test'] } })
  assert.equal(adapter.getItem('wishlist-storage').state.items[0], 'test')
  storage.setItem('recently-viewed-storage', 'old')
  consent.rejectNonEssentialConsent()
  assert.equal(storage.getItem('wishlist-storage'), null)
  assert.equal(storage.getItem('recently-viewed-storage'), null)
  assert.ok(resets > 0)

  const wishlist = load('src/store/wishlist.ts').useWishlistStore
  await wishlist.getState().addItem({ productId: 'jacket-1', name: 'Test', price: 50, image: '', slug: 'test' })
  assert.equal(wishlist.getState().items.length, 1, 'Wishlist remains usable in memory')
  assert.equal(storage.getItem('wishlist-storage'), null)
  consent.saveConsent({ functional: true, analytics: false, marketing: false })
  await wishlist.getState().addItem({ productId: 'jacket-2', name: 'Test 2', price: 50, image: '', slug: 'test-2' })
  assert.equal(JSON.parse(storage.getItem('wishlist-storage')).state.items.length, 2)
  consent.rejectNonEssentialConsent()

  const recent = load('src/store/recently-viewed.ts').useRecentlyViewedStore
  const product = { id: 'jacket-1', name: 'Test', slug: 'test', description: '', price: 50, images: [], category: { name: 'Varsity', slug: 'varsity-jackets' }, isFeatured: false }
  recent.getState().addItem(product)
  assert.equal(recent.getState().items.length, 1)
  assert.equal(storage.getItem('recently-viewed-storage'), null)
  consent.saveConsent({ functional: true, analytics: false, marketing: false })
  recent.getState().addItem({ ...product, id: 'jacket-2' })
  assert.equal(JSON.parse(storage.getItem('recently-viewed-storage')).state.items.length, 2)
  consent.rejectNonEssentialConsent()

  const { GoogleAnalytics } = load('src/components/google-analytics.tsx')
  assert.equal(renderAnalytics(GoogleAnalytics), null)
  assert.equal(windowMock.gtag, undefined, 'No Google initialization before opt-in')
  windowMock.gtag = (...args) => calls.push(args)
  consent.saveConsent({ functional: false, analytics: true, marketing: false })
  assert.ok(renderAnalytics(GoogleAnalytics), 'Google script is rendered after opt-in')
  const pageView = calls.find(args => args[0] === 'event' && args[1] === 'page_view')
  assert.ok(pageView)
  assert.equal(pageView[2].page_location, 'https://www.jacketee.com/shop', 'Do not forward query or fragment data')
  const eventCount = calls.filter(args => args[0] === 'event').length
  consent.rejectNonEssentialConsent()
  assert.equal(renderAnalytics(GoogleAnalytics), null)
  assert.equal(calls.filter(args => args[0] === 'event').length, eventCount, 'No page-view event on withdrawal')
  assert.equal(windowMock['ga-disable-G-CBXZ857LW9'], true)
  consent.saveConsent({ functional: false, analytics: true, marketing: false })
  renderAnalytics(GoogleAnalytics)
  storage.removeItem(consent.COOKIE_CONSENT_KEY)
  windowMock.dispatchEvent({ type: 'storage', key: consent.COOKIE_CONSENT_KEY })
  assert.equal(renderAnalytics(GoogleAnalytics), null, 'Consent withdrawal in another tab disables analytics')

  const policies = load('src/data/site-policies.tsx')
  const { LegalPolicyPage } = load('src/components/legal-policy-page.tsx')
  for (const policy of [policies.privacyPolicy, policies.termsPolicy, policies.cookiePolicy]) {
    const html = renderToString(React.createElement(LegalPolicyPage, { policy }))
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
    assert.equal(ids.length, new Set(ids).size)
    for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]))
    assert.ok(!html.includes('opacity:0'), 'Policy text is visible without animation or hydration')
    assert.ok(html.includes('2026-10-23'))
    assert.ok(html.includes('mailto:info@jacketee.com'))
  }
  const terms = renderToString(React.createElement(LegalPolicyPage, { policy: policies.termsPolicy }))
  assert.ok(!terms.includes('perpetual'))
  assert.ok(!terms.includes('incorporated'))
  assert.ok(terms.includes('mandatory'))
  assert.ok(policies.storageInventory.some(item => item.name === 'guest_id' && item.lifetime.includes('365')))
  console.log('Policy checks passed: optional storage consent, wishlist persistence, analytics opt-in/withdrawal/cross-tab reset, query redaction and accessible policy SSR.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
