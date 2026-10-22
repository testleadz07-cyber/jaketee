/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToString } = require('react-dom/server')

const cache = new Map()
const empty = () => null
let database = false
let databaseFails = false
const mocks = {
  'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  '@/components/header': { Header: empty },
  '@/components/footer': { Footer: empty },
  '@/components/whatsapp-help': { WhatsAppButton: empty },
  '@/lib/mongodb': { connectDB: async () => database },
  '@/models/Faq': { __esModule: true, default: { find: () => ({ sort: () => ({ lean: async () => { if (databaseFails) throw Error('Database unavailable'); return [] } }) }) } },
}
function load(file) {
  if (cache.has(file)) return cache.get(file)
  const exports = {}
  cache.set(file, exports)
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, process, console: { error() {} }, require(id) {
      if (id in mocks) return mocks[id]
      if (!id.startsWith('@/') && !id.startsWith('.')) return require(id)
      let path
      if (id.startsWith('@/')) path = `src/${id.slice(2)}`
      else path = require('node:path').resolve(require('node:path').dirname(file), id)
      return load(`${path}${fs.existsSync(`${path}.tsx`) ? '.tsx' : '.ts'}`)
    },
  }, { filename: file })
  return exports
}

const { buildFaqCategories, faqSectionId } = load('src/lib/faq-page-data.ts')
const { filterFaqCategories, faqQuestionId } = load('src/lib/faq-search.ts')
const categories = buildFaqCategories([])
const allItems = categories.flatMap(category => category.items)
assert.ok(categories.some(category => faqSectionId(category.title) === 'production-delivery'))
assert.ok(filterFaqCategories(categories, 'shipping').length > 0)
assert.ok(filterFaqCategories(categories, 'business days').length > 0, 'Search answers, not only questions')
assert.equal(filterFaqCategories(categories, 'not-a-real-phrase-xyz').length, 0)
assert.equal(filterFaqCategories(categories, 'shipping', 'Jacket Sizing').length, 0)
assert.equal(filterFaqCategories(categories, '').flatMap(category => category.items).length, allItems.length)
const fixture = [{ title: 'Design', items: [{ question: 'Can I add a café logo?', answer: ['Choose artwork.'], bullets: ['Use a vector file.'], ordered: ['Approve a mockup.'], aliases: ['Can I upload my crest?'] }] }]
for (const query of ['CAFE logo', 'vector', 'approve mockup', 'upload crest']) assert.equal(filterFaqCategories(fixture, query).length, 1, query)
const example = { id: 'test', question: 'How do I place an order?', category: 'Orders', answer: ['A replacement answer.'], bullets: [], ordered: [], mergedQuestions: [] }
assert.equal(buildFaqCategories([example]).flatMap(category => category.items).filter(item => item.question === example.question).length, 1)
assert.ok(!buildFaqCategories([{ ...example, status: 'draft' }]).flatMap(category => category.items).some(item => item.question === example.question))
assert.ok(!buildFaqCategories([{ ...example, answer: [] }]).flatMap(category => category.items).some(item => item.question === example.question))
const aliases = buildFaqCategories([{ ...example, mergedQuestions: ['Where can I buy?'] }])
assert.ok(filterFaqCategories(aliases, 'where buy').some(category => category.items.some(item => item.question === example.question)))
assert.equal(new Set(allItems.map(item => faqQuestionId(item.question))).size, allItems.length)
assert.equal(faqQuestionId('How do I order?'), faqQuestionId('How do I order?'))

;(async () => {
  const FaqPage = load('src/app/faq/faq-client.tsx').default
  const render = () => renderToString(React.createElement(FaqPage, { categories }))
  const html = render()
  assert.equal(html, render(), 'Initial search and accordion state must be deterministic')
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1)
  assert.ok(!/<details[\s>]/.test(html))
  for (const href of ['/track-order', '/size-guide', '/shipping', '/returns', '/contact']) assert.ok(html.includes(`href="${href}"`), href)
  for (const item of allItems) assert.ok(html.includes(`id="${faqQuestionId(item.question)}"`))
  assert.ok(html.includes('role="search"') && html.includes('Expand all'))
  assert.ok(html.includes('No order or account details needed.'))
  const Page = load('src/app/faq/page.tsx').default
  for (const options of [[false, false], [true, true]]) {
    ;[database, databaseFails] = options
    const rendered = renderToString(await Page())
    const json = rendered.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1]
    assert.ok(json, 'Keep FAQ structured data during database outages')
    const schema = JSON.parse(json)
    assert.equal(schema.mainEntity.length, allItems.length)
    assert.ok(rendered.includes('How do I place an order?'))
  }
  console.log('FAQ checks passed: answer/alias search, topic filters, draft suppression, stable answer links, accessible SSR, schema and database-outage fallback.')
})().catch(error => { console.error(error); process.exitCode = 1 })
