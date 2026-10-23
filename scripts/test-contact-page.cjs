/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToString } = require('react-dom/server')

const cache = new Map()
const sent = []
const saved = []
const notifications = []
let emailFails = false
let dbAvailable = true
let saveFails = false
const mocks = {
  'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  'next/server': { NextResponse: { json: (data, options = {}) => ({ data, status: options.status || 200 }) } },
  '@/components/header': { Header: () => null },
  '@/components/footer': { Footer: () => null },
  '@/lib/activity': { logUserActivity: async () => false },
  '@/lib/mongodb': { connectDB: async () => dbAvailable },
  '@/models/ContactMessage': { __esModule: true, default: { create: async data => { if (saveFails) throw Error('Save failed'); saved.push(data) } } },
  '@/lib/notifications': { createNotification: async data => notifications.push(data) },
  '@/lib/email': {
    sendEmail: async data => { if (emailFails === 'throw') throw Error('Email unavailable'); if (emailFails) return { success: false }; sent.push(data); return { success: true } },
    contactFormTemplate: data => JSON.stringify(data), contactCustomerReplyTemplate: data => JSON.stringify(data),
  },
}
function load(file) {
  if (cache.has(file)) return cache.get(file)
  const exports = {}
  cache.set(file, exports)
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, process, console: { error() {} }, requestAnimationFrame: callback => callback(), require(id) {
      if (id in mocks) return mocks[id]
      if (!id.startsWith('@/') && !id.startsWith('.')) return require(id)
      const base = id.startsWith('@/') ? `src/${id.slice(2)}` : path.resolve(path.dirname(file), id)
      return load(base + (fs.existsSync(`${base}.tsx`) ? '.tsx' : '.ts'))
    },
  }, { filename: file })
  return exports
}

async function main() {
  const { validateContact, contactLimits } = load('src/lib/contact-validation.ts')
  const valid = { name: ' Alex ', email: ' alex@example.com ', subject: ' Sizing help ', message: ' How should I measure? ', country: 'uk' }
  const clean = validateContact(valid)
  assert.equal(Object.keys(clean.errors).length, 0)
  assert.equal(clean.values.country, 'GB')
  assert.equal(clean.values.name, 'Alex')
  assert.equal(validateContact({ ...valid, country: '' }).values.country, '')
  for (const invalid of [null, [], {}, { ...valid, message: '   ' }, { ...valid, email: 'invalid' }, { ...valid, name: {} }, { ...valid, country: 'RU' }, { ...valid, message: 'x'.repeat(contactLimits.message + 1) }]) assert.ok(Object.keys(validateContact(invalid).errors).length)

  const { POST } = load('src/app/api/contact/route.ts')
  assert.equal((await POST({ json: async () => { throw Error('Invalid JSON') } })).status, 400)
  for (const invalid of [null, {}, { ...valid, email: 'invalid' }, { ...valid, message: ' ' }, { ...valid, subject: 'x'.repeat(201) }]) assert.equal((await POST({ json: async () => invalid })).status, 400)
  assert.equal(sent.length, 0, 'Invalid submissions never send email')
  assert.equal(saved.length, 0)
  const success = await POST({ json: async () => valid })
  assert.equal(success.status, 200)
  assert.equal(success.data.success, true)
  assert.equal(sent.length, 2)
  assert.equal(sent[1].to, 'alex@example.com')
  assert.equal(saved[0].message, 'Delivery country: GB\n\nHow should I measure?')
  assert.equal(notifications.length, 1)
  emailFails = true
  assert.equal((await POST({ json: async () => valid })).status, 200, 'Email failure must not lose a saved inquiry')
  emailFails = 'throw'
  assert.equal((await POST({ json: async () => valid })).status, 200)
  assert.equal(saved.length, 3)
  const emailsBeforeFailure = sent.length
  dbAvailable = false
  assert.equal((await POST({ json: async () => valid })).status, 503)
  dbAvailable = true
  saveFails = true
  assert.equal((await POST({ json: async () => valid })).status, 500)
  assert.equal(sent.length, emailsBeforeFailure, 'Unstored inquiries must not trigger confirmation emails')
  assert.equal(saved.length, 3)

  const html = renderToString(React.createElement(load('src/app/contact/page.tsx').default))
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  assert.equal(ids.length, new Set(ids).size)
  for (const match of html.matchAll(/for="([^"]+)"/g)) assert.ok(ids.includes(match[1]))
  for (const href of ['mailto:info@jacketee.com', 'tel:+923187328027', '/track-order', '/bulk-orders', '/size-guide', '/faq', '/privacy-policy', '#send-message']) assert.ok(html.includes(`href="${href}"`), href)
  assert.ok(html.includes('https://wa.me/'))
  assert.ok(html.includes('Delivery country'))
  assert.ok(!html.includes('Always open'))
  console.log('Contact checks passed: validation, API rejection/success/failure, no real emails, SSR labels, contact channels and help links.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
