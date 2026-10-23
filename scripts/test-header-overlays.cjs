// Offline checks: no authentication requests, database, browser storage or order writes.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const noop = () => {}
const placeholder = () => null
const updates = [], removals = []
let hydrated = false
const item = {
  id: 'cart-line', productId: 'product', name: 'PersonalizedVarsityJacket'.repeat(8),
  image: '/placeholder.png', price: 149, quantity: 123,
  variants: [{ name: 'Embroidery', value: 'CustomTeamName'.repeat(8) }],
}
const store = {
  items: [item], appliedPromo: null,
  removeItem: id => removals.push(id),
  updateQuantity: (id, quantity) => updates.push({ id, quantity }),
  getTotalPrice: () => store.items.reduce((sum, row) => sum + row.price * row.quantity, 0),
  getDiscountedTotalPrice: () => store.getTotalPrice(),
  setAppliedPromo: noop, clearAppliedPromo: noop,
}
const hookReact = { ...React, useState: initial => [initial, noop], useEffect: noop,
  useSyncExternalStore: (_, client, server) => hydrated ? client() : server(),
}
const link = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)
const button = ({ asChild, variant, size, children, ...props }) => asChild
  ? React.cloneElement(React.Children.only(children), props)
  : React.createElement('button', props, children)
const passthrough = ({ children }) => React.createElement(React.Fragment, null, children)
const sheets = Object.fromEntries(['Sheet', 'SheetClose', 'SheetContent', 'SheetDescription', 'SheetFooter', 'SheetHeader', 'SheetTitle', 'SheetTrigger'].map(key => [key, passthrough]))
// Distinct identities allow checking which primitive receives each contract.
for (const key of Object.keys(sheets)) sheets[key] = ({ children }) => React.createElement(React.Fragment, null, children)
const dropdowns = Object.fromEntries(['DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuLabel', 'DropdownMenuSeparator', 'DropdownMenuTrigger'].map(key => [key, ({ children }) => React.createElement(React.Fragment, null, children)]))
function load(file, extra = {}) {
  const mocks = {
    react: hookReact, 'next/link': { __esModule: true, default: link },
    '@/components/ui/button': { Button: button }, '@/components/ui/sheet': sheets,
    '@/components/ui/input': { Input: props => React.createElement('input', props) },
    '@/components/ui/separator': { Separator: placeholder },
    '@/components/optimized-image': { __esModule: true, default: placeholder },
    '@/store/cart': { useCartStore: () => store }, '@/hooks/use-toast': { useToast: () => ({ toast: noop }) },
    '@/lib/activity': { logUserActivity: noop },
    '@/types/jacket-customization': { getCustomizedViews: () => [], getJacketViewLabel: value => value, getJacketTextSummary: () => '' },
    '@/config/fulfillment': { fulfillmentConfig: {} },
    ...extra,
  }
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { exports, console,
    require(id) {
      if (id in mocks) return mocks[id]
      if (id.startsWith('@/')) throw Error('Unexpected application import: ' + id)
      return require(id)
    },
  }, { filename: file })
  return exports
}
function flatten(node) {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(flatten)
  return [node, ...React.Children.toArray(node.props?.children).flatMap(flatten)]
}

const { CartDrawer } = load('src/components/cart-drawer.tsx')
assert.ok(renderToStaticMarkup(CartDrawer()).includes('Open shopping cart with 0 items'), 'SSR must not expose a different persisted cart before hydration')
hydrated = true
let tree = CartDrawer(), nodes = flatten(tree)
const html = renderToStaticMarkup(tree)
assert.ok(html.includes('Open shopping cart with 123 items'))
assert.ok(html.includes('99+'), 'Large cart counts must have a compact visible badge')
assert.ok(html.includes(item.name), 'Long names remain available instead of being dropped')
assert.ok(!/<a\b[^>]*>\s*<button/.test(html), 'Checkout must not nest a button inside an anchor')
nodes.find(node => node.props?.['aria-label'] === `Increase quantity of ${item.name}`).props.onClick()
assert.equal(updates.at(-1).quantity, 124)
item.quantity = 1
nodes = flatten(CartDrawer())
nodes.find(node => node.props?.['aria-label'] === `Decrease quantity of ${item.name}`).props.onClick()
assert.equal(updates.at(-1).quantity, 1)
nodes.find(node => node.props?.['aria-label'] === `Remove ${item.name} from cart`).props.onClick()
assert.deepEqual(removals, ['cart-line'])
assert.ok(nodes.some(node => node.type === sheets.SheetClose && flatten(node).some(child => child.props?.href === '/checkout')), 'Checkout closes the cart before navigation')
store.items = []
const empty = renderToStaticMarkup(CartDrawer())
assert.ok(empty.includes('Your cart is empty'))
assert.ok(!empty.includes('href="/checkout"'))

const { Header } = load('src/components/header.tsx', {
  'next-auth/react': { useSession: () => ({ status: 'authenticated', data: { user: { name: 'LongAccountName'.repeat(12), email: 'long-account@example.com' } } }), signOut: noop },
  '@/components/brand-logo': { BrandLogo: placeholder },
  '@/components/cart-drawer': { CartDrawer: placeholder },
  '@/components/header-search': { HeaderSearch: placeholder },
  '@/components/header-navigation': { DesktopHeaderNavigation: placeholder, HeaderSupportMenu: placeholder, MobileHeaderNavigation: placeholder },
  '@/components/theme-toggle': { ThemeToggle: placeholder },
  '@/components/ui/dropdown-menu': dropdowns,
})
const account = flatten(Header()).find(node => node.type === dropdowns.DropdownMenu)
assert.equal(account.props.modal, false, 'The small account menu must not lock or resize the background page')
assert.ok(flatten(account).some(node => node.props?.href === '/profile'))
console.log('Header overlay checks passed: signed-in non-modal account menu, cart hydration/counts, long labels, quantity/removal actions, checkout close, and empty cart. No real services accessed.')
