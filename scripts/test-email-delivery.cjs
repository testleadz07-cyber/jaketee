const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const vm = require('node:vm')
function load(file, mocks, extra = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, require: id => { assert.ok(id in mocks, id); return mocks[id] }, Buffer, TextEncoder, AbortSignal,
    console: { error() {} }, ...extra,
  })
  return exports
}
const mail = { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' }
async function emailCase(env, fetchImpl) {
  let smtp = 0, closed = 0, requests = 0
  const lib = load('src/lib/email.ts', {
    '@/types/jacket-customization': {},
    nodemailer: { default: { createTransport: () => { smtp++; return { sendMail: async () => ({ accepted: [mail.to] }), close: () => closed++ } } } },
  }, { process: { env }, fetch: async (...args) => { requests++; return fetchImpl(...args) } })
  const result = await lib.sendEmail(mail)
  return { result, smtp, closed, requests }
}
async function newsletter(success, database = true, existing = null, retryAvailable = true) {
  let saved = 0, emails = 0
  const lib = load('src/app/api/newsletter/subscribe/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/mongodb': { connectDB: async () => database },
    '@/models/Subscriber': { default: { findOne: async () => existing, findOneAndUpdate: async filter => { assert.equal(filter.welcomeEmailStatus, 'failed'); assert.ok(filter.welcomeEmailAttemptAt.$lt); return retryAvailable ? { _id: 'existing' } : null }, create: async () => { saved++; return { _id: 'subscriber' } }, updateOne: async () => ({}) } },
    '@/lib/notifications': { createNotification: async () => {} },
    '@/lib/email': { newsletterSubscriptionTemplate: () => '', sendEmail: async () => { emails++; return { success } } },
    '@/lib/turnstile': { requireTurnstile: async () => null },
  }, { process: { env: {} } })
  return { response: await lib.POST({ json: async () => ({ email: mail.to }) }), saved, emails }
}
async function claimCase(success, exists = true, configured = true) {
  const deleted = [], sent = []
  const lib = load('src/app/api/orders/claim/route.ts', {
    crypto: { default: { randomBytes: () => ({ toString: () => 'test-token' }), createHash: () => ({ update: () => ({ digest: () => 'hash' }) }) } },
    mongoose: { default: { isValidObjectId: () => true } },
    'next-auth': { getServerSession: async () => ({ user: { id: 'user' } }) },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/auth-options': { authOptions: {} }, '@/lib/mongodb': { connectDB: async () => true },
    '@/lib/email': { emailConfigurationError: () => configured ? null : 'Missing config', guestOrderClaimTemplate: () => 'claim', sendEmail: async () => { sent.push(1); return { success, code: 'TIMEOUT' } } },
    '@/models/GuestOrderClaim': { default: { create: async () => ({ _id: 'new-claim' }), deleteOne: async filter => deleted.push(filter) } },
    '@/models/Order': { default: { exists: async () => exists } },
  }, { process: { env: {} } })
  return { response: await lib.POST({ json: async () => ({ action: 'request', email: mail.to }), nextUrl: { origin: 'https://test.example' } }), deleted, sent }
}

;(async () => {
  const missing = await emailCase({ SMTP_USER: 'present', SMTP_PASS: 'present' })
  assert.equal(missing.result.code, 'CONFIGURATION'); assert.equal(missing.smtp, 0)
  const unknown = await emailCase({ EMAIL_PROVIDER: 'typo' }); assert.equal(unknown.result.success, false)
  const smtp = await emailCase({ EMAIL_PROVIDER: 'smtp', SMTP_USER: 'test', SMTP_PASS: 'test' })
  assert.equal(smtp.result.status, 'accepted'); assert.equal(smtp.closed, 1)
  const env = { EMAIL_PROVIDER: 'cloudflare-api', CLOUDFLARE_ACCOUNT_ID: 'account', CLOUDFLARE_EMAIL_API_TOKEN: 'secret' }
  const api = await emailCase(env, async (_url, init) => { assert.ok(init.signal); assert.equal(JSON.parse(init.body).to, mail.to); return { ok: true, json: async () => ({ success: true, result: { queued: [mail.to] } }) } })
  assert.equal(api.result.success, true); assert.equal(api.smtp, 0)
  const rejected = await emailCase(env, async () => ({ ok: false, status: 403, json: async () => ({ errors: [{ code: 10102 }] }) }))
  assert.equal(rejected.result.code, 'API_10102')
  const timeout = await emailCase(env, async () => { throw { name: 'TimeoutError', message: 'secret provider details' } })
  assert.equal(timeout.result.code, 'TIMEOUT'); assert.ok(!JSON.stringify(timeout.result).includes('secret'))
  const blocked = await emailCase({ ...env, MIGRATION_TEST_MODE: 'true', EMAIL_TEST_RECIPIENTS: 'other@example.com' })
  assert.equal(blocked.result.code, 'TEST_RECIPIENT_NOT_ALLOWED'); assert.equal(blocked.requests, 0)
  const fail = await newsletter(false); assert.equal(fail.saved, 1); assert.equal(fail.response.status, 201)
  assert.equal(fail.response.body.emailStatus, 'failed'); assert.ok(!fail.response.body.message.includes('check your email'))
  const ok = await newsletter(true); assert.equal(ok.response.body.emailStatus, 'accepted')
  const dbFail = await newsletter(false, false); assert.equal(dbFail.emails, 0); assert.equal(dbFail.saved, 0)
  const retry = await newsletter(true, true, { _id: 'existing' }); assert.equal(retry.saved, 0); assert.equal(retry.emails, 1)
  const duplicate = await newsletter(true, true, { _id: 'existing' }, false); assert.equal(duplicate.response.status, 409); assert.equal(duplicate.emails, 0)
  const claimFailed = await claimCase(false), claimAbsent = await claimCase(false, false)
  assert.equal(claimFailed.response.status, claimAbsent.response.status)
  assert.equal(JSON.stringify(claimFailed.response.body), JSON.stringify(claimAbsent.response.body))
  assert.equal(claimFailed.deleted.length, 1); assert.equal(claimFailed.deleted[0]._id, 'new-claim')
  const claimOk = await claimCase(true); assert.equal(claimOk.deleted.length, 0)
  const claimConfig = await claimCase(false, true, false); assert.equal(claimConfig.response.status, 503); assert.equal(claimConfig.sent.length, 0)
  console.log('Email checks passed: explicit provider, API acceptance/rejection, timeout, SMTP close, allowlist, truthful newsletter status and save failure.')
})().catch(error => { console.error(error); process.exitCode = 1 })
