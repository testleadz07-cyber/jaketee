/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToString } = require('react-dom/server')

const cache = new Map()
let session = { data: null, status: 'unauthenticated' }
const routes = []
const requests = []
const timers = new Map()
let timerId = 0
let slots = []
let cursor = 0
let dirty = false
let effects = []
const router = { push: href => routes.push(href) }
const hookReact = {
  useId: () => 'search-test',
  useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index] },
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { const next = typeof value === 'function' ? value(slots[index]) : value; if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true } }] },
  useEffect(effect, deps) { const index = cursor++; const previous = slots[index]; if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) { slots[index] = { deps, cleanup: previous?.cleanup }; effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = effect() }) } },
}
const mocks = {
  'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  'next/navigation': { useRouter: () => router, usePathname: () => '/shop' },
  'next-auth/react': { useSession: () => session, signOut: () => {} },
  '@/components/optimized-image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
  '@/components/brand-logo': { BrandLogo: () => React.createElement('span', null, 'Jacketee') },
  '@/components/cart-drawer': { CartDrawer: () => React.createElement('button', { 'aria-label': 'Open shopping cart' }, 'Cart') },
  '@/components/theme-toggle': { ThemeToggle: () => React.createElement('button', { 'aria-label': 'Switch theme' }, 'Theme') },
  '@/components/whatsapp-help': { WhatsAppHelp: () => null },
}
function load(file, behavior = false) {
  const key = `${file}:${behavior}`
  if (cache.has(key)) return cache.get(key)
  const exports = {}; cache.set(key, exports)
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, process, console, AbortController,
    document: { addEventListener() {}, removeEventListener() {}, getElementById: () => null },
    setTimeout: callback => { timers.set(++timerId, callback); return timerId }, clearTimeout: id => timers.delete(id),
    fetch: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })),
    require(id) {
      if (behavior && id === 'react') return hookReact
      if (id in mocks) return mocks[id]
      if (!id.startsWith('@/') && !id.startsWith('.')) return require(id)
      const base = id.startsWith('@/') ? `src/${id.slice(2)}` : path.resolve(path.dirname(file), id)
      return load(base + (fs.existsSync(`${base}.tsx`) ? '.tsx' : '.ts'))
    },
  }, { filename: file })
  return exports
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  for (const child of React.Children.toArray(node.props?.children)) { const match = find(child, predicate); if (match) return match }
  return null
}
const input = tree => find(tree, node => node.props?.role === 'combobox')
function render(Component) {
  for (let iteration = 0; iteration < 8; iteration++) {
    cursor = 0; dirty = false
    const tree = Component({})
    const pending = effects; effects = []; pending.forEach(effect => effect())
    if (!dirty) return tree
  }
  throw Error('Search did not settle')
}
async function runTimer() { const callback = [...timers.values()][0]; assert.ok(callback); timers.clear(); void callback(); await Promise.resolve() }
async function resolveRequest(index, products) { requests[index].resolve({ ok: true, json: async () => products }); for (let i = 0; i < 5; i++) await Promise.resolve() }

async function main() {
  const { Header } = load('src/components/header.tsx')
  const html = renderToString(React.createElement(Header))
  assert.equal(html, renderToString(React.createElement(Header)), 'Stable initial SSR')
  assert.equal((html.match(/role="search"/g) || []).length, 1, 'One visible search form across breakpoints')
  assert.ok(html.includes('Search products by name or style'))
  assert.ok(html.includes('Open navigation menu'))
  assert.ok(html.includes('Patches &amp; Embroidery'))
  assert.ok(html.includes('Shop All'))
  assert.ok(html.includes('lg:block'))
  assert.ok(!html.includes('xl:hidden'))
  session = { status: 'authenticated', data: { user: { name: 'Alex', email: 'alex@example.com', role: 'admin' } } }
  const authenticated = renderToString(React.createElement(Header))
  assert.ok(authenticated.includes('Open account menu'))
  const nav = load('src/data/header-navigation.ts')
  assert.equal(nav.bulkOrderLinks.length, 6)
  assert.equal(nav.customJacketLinks.length, 5)
  for (const entry of [...nav.varsitySubcategoryLinks, ...nav.otherStyleLinks, ...nav.customJacketLinks, ...nav.bulkOrderLinks, ...nav.supportLinks]) assert.ok(entry.href.startsWith('/') && !entry.href.startsWith('//'))
  const headerSource = fs.readFileSync('src/components/header.tsx', 'utf8')
  assert.ok(headerSource.includes('SheetContent'))
  assert.ok(!headerSource.includes('createPortal'))
  assert.ok(headerSource.indexOf('MobileHeaderNavigation onNavigate') < headerSource.indexOf('Hello,'), 'Shopping precedes account content in the drawer')
  assert.ok(fs.readFileSync('src/components/header-navigation.tsx', 'utf8').includes('delayDuration={350}'))

  slots = []; effects = []; dirty = false
  const { HeaderSearch } = load('src/components/header-search.tsx', true)
  let tree = render(HeaderSearch)
  input(tree).props.onChange({ target: { value: 'varsity' } })
  tree = render(HeaderSearch); await runTimer()
  assert.ok(requests[0].url.includes('varsity'))
  input(tree).props.onChange({ target: { value: 'bomber' } })
  tree = render(HeaderSearch); await runTimer()
  assert.equal(requests[0].options.signal.aborted, true)
  await resolveRequest(1, [{ id: 'bomber', name: 'Bomber jacket', slug: 'bomber', price: 80, thumbnail: '' }])
  tree = render(HeaderSearch)
  await resolveRequest(0, [{ id: 'old', name: 'Outdated varsity', slug: 'old', price: 50, thumbnail: '' }])
  tree = render(HeaderSearch)
  assert.ok(find(tree, node => node.props?.role === 'option' && node.props.id === 'search-test-option-0'))
  assert.ok(!JSON.stringify(tree).includes('Outdated varsity'), 'Late results cannot overwrite the newest query')
  input(tree).props.onChange({ target: { value: 'bomber ' } })
  tree = render(HeaderSearch)
  assert.equal(timers.size, 0, 'Whitespace changes keep completed suggestions without getting stuck loading')
  input(tree).props.onKeyDown({ key: 'ArrowDown', preventDefault() {} })
  tree = render(HeaderSearch)
  assert.equal(input(tree).props['aria-activedescendant'], 'search-test-option-0')
  input(tree).props.onKeyDown({ key: 'Enter', preventDefault() {} })
  tree = render(HeaderSearch)
  assert.ok(routes.at(-1).includes('bomber'))
  assert.equal(input(tree).props.value, '')
  input(tree).props.onChange({ target: { value: 'school jacket' } })
  tree = render(HeaderSearch)
  const form = find(tree, node => node.type === 'form')
  form.props.onSubmit({ preventDefault() {} })
  assert.equal(routes.at(-1), '/shop?search=school%20jacket')
  tree = render(HeaderSearch)
  input(tree).props.onFocus()
  tree = render(HeaderSearch)
  input(tree).props.onKeyDown({ key: 'Escape' })
  tree = render(HeaderSearch)
  assert.equal(input(tree).props['aria-expanded'], false)
  input(tree).props.onChange({ target: { value: 'x' } })
  tree = render(HeaderSearch)
  assert.equal(input(tree).props['aria-expanded'], false)
  assert.equal(timers.size, 0)
  console.log('Header checks passed: stable guest/account SSR, single visible search, six bulk programs, accessible drawer/navigation primitives, stale-request protection, keyboard suggestions, whitespace, Escape and full shop search.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
