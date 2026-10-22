/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToString, renderToStaticMarkup } = require('react-dom/server')

const cache = new Map()
const empty = () => null
const mocks = {
  'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  '@/components/header': { Header: empty },
  '@/components/footer': { Footer: empty },
  '@/components/breadcrumbs': { Breadcrumbs: empty },
  '@/components/custom-design-section': { CustomDesignSection: empty },
  '@/components/whatsapp-help': { WhatsAppButton: empty },
  '@/components/collection-design-image': { CollectionDesignImage: empty },
}
function load(file) {
  if (cache.has(file)) return cache.get(file)
  const exports = {}
  cache.set(file, exports)
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText
  vm.runInNewContext(code, {
    exports,
    require(id) {
      if (id in mocks) return mocks[id]
      if (!id.startsWith('@/')) return require(id)
      const path = `src/${id.slice(2)}`
      if (path.endsWith('.json')) return JSON.parse(fs.readFileSync(path, 'utf8'))
      return load(`${path}${fs.existsSync(`${path}.tsx`) ? '.tsx' : '.ts'}`)
    },
  }, { filename: file })
  return exports
}

const { methods, placementImages, faqs } = load('src/data/patch-decoration.ts')
const { PatchDecorationPage } = load('src/components/patch-decoration-page.tsx')
const props = { hero: { url: 'https://example.com/hero.jpg', alt: 'Jacket decoration' }, heroFallback: 'https://example.com/hero.jpg', placements: placementImages, methods, faqJsonLd: {} }
const render = () => renderToString(React.createElement(PatchDecorationPage, props))
const html = render()
assert.equal(html, render(), 'Initial disclosure state and IDs must render deterministically')
assert.ok(!/<details[\s>]/.test(html), 'Patch disclosures must not use browser-managed native open attributes')
assert.equal((html.match(/aria-expanded="false"/g) || []).length, methods.length + faqs.length + 7)
assert.ok(!/aria-expanded="true"/.test(html))
for (const method of methods) {
  assert.ok(html.includes(`id="${method.id}"`), method.id)
  const text = renderToStaticMarkup(React.createElement('span', null, method.made)).slice(6, -7)
  assert.ok(html.includes(text), `Closed panels must preserve server-rendered content: ${method.id}`)
}
console.log('Patch disclosures passed: deterministic SSR, accessible closed triggers, no native details, and all method content retained.')
