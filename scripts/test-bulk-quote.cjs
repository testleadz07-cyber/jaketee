/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const vm = require('node:vm')

async function scenario({ database = true, saveFails = false, emailFails = false, withLogo = false, configured = true, values = {} } = {}) {
  const saved = [], emails = [], notifications = [], events = []
  const exports = {}
  const mocks = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/config/fulfillment': { shippingCountryError: () => null },
    '@/lib/rate-limit': { checkRateLimit: () => ({ success: true }), getClientIp: () => 'test', rateLimitHeaders: () => ({}) },
    '@/lib/mongodb': { connectDB: async () => database },
    '@/models/ContactMessage': { default: { create: async data => { if (saveFails) throw Error('write failed'); saved.push(data); events.push('save') } } },
    '@/lib/notifications': { createNotification: async data => notifications.push(data) },
    '@/lib/email': { contactFormTemplate: data => data.message, sendEmail: async data => { emails.push(data); events.push('email'); if (emailFails) throw Error('smtp failed'); return { success: true } } },
  }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/bulk-quote/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, require: id => { assert.ok(id in mocks, id); return mocks[id] }, Buffer, File,
    process: { env: configured ? { SMTP_USER: 'owner@example.com', SMTP_PASS: 'test' } : {} }, console: { error() {} },
  })
  const form = new FormData()
  for (const [key, value] of Object.entries({ name: 'Quote test', email: 'test@example.com', organization: 'Test team', quantity: '25', jacketType: 'Varsity jacket', deadline: '2027-01-01', country: 'US', ...values })) form.set(key, value)
  if (withLogo) form.set('logo', new File(['logo'], 'team.png', { type: 'image/png' }))
  const response = await exports.POST({ headers: new Headers(), formData: async () => form })
  return { response, saved, emails, notifications, events }
}

;(async () => {
  const success = await scenario({ withLogo: true })
  assert.equal(success.response.status, 200)
  assert.equal(success.saved.length, 1)
  assert.equal(success.saved[0].read, false)
  assert.equal(success.saved[0].subject, 'Bulk jacket quote request')
  for (const detail of ['Test team', '25', 'Varsity jacket', '2027-01-01', 'US', 'team.png']) assert.ok(success.saved[0].message.includes(detail), detail)
  assert.deepEqual(success.events, ['save', 'email'])
  assert.equal(success.emails[0].attachments.length, 1)
  assert.equal(success.saved[0].attachments[0].filename, 'team.png')
  assert.equal(success.saved[0].attachments[0].content.toString(), 'logo')
  assert.equal(success.notifications[0].link, '/admin/contact-messages')
  const flexible = await scenario({ values: { deadline: '', program: 'Schools & Teams', notes: 'Names on sleeves; sample requested.', jacketType: 'Not sure / need advice' } })
  assert.equal(flexible.response.status, 200)
  for (const detail of ['Not sure yet', 'Schools & Teams', 'Names on sleeves; sample requested.', 'Not sure / need advice']) assert.ok(flexible.saved[0].message.includes(detail), detail)
  for (const [field, value] of [['quantity', '9'], ['quantity', '10.5'], ['email', 'invalid'], ['deadline', '2027-02-30'], ['notes', 'x'.repeat(4001)], ['program', 'x'.repeat(201)]]) {
    const invalid = await scenario({ values: { [field]: value } })
    assert.equal(invalid.response.status, 400)
    assert.ok(invalid.response.body.fieldErrors[field])
    assert.equal(invalid.saved.length, 0)
  }
  for (const options of [{ emailFails: true }, { configured: false }]) {
    const result = await scenario(options)
    assert.equal(result.response.status, 200)
    assert.equal(result.saved.length, 1)
  }
  for (const options of [{ database: false }, { saveFails: true }]) {
    const result = await scenario(options)
    assert.ok(result.response.status >= 500)
    assert.equal(result.saved.length, 0)
    assert.equal(result.emails.length, 0)
  }
  console.log('Bulk quote checks passed: admin persistence, quote details, logo email, notifications, database failures and email failures.')
})().catch(error => { console.error(error); process.exitCode = 1 })
