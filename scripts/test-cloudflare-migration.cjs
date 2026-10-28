/* eslint-disable @typescript-eslint/no-require-imports */
// Offline contract tests: no real database, mail, payment or push traffic.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { webcrypto } = require('node:crypto')

function harness(env = {}, mocks = {}, fetcher = async () => { throw Error('Unexpected network request') }) {
  const cache = new Map()
  const context = vm.createContext({ process: { env }, console, Buffer, crypto: webcrypto,
    Request, Response, Headers, FormData, File, Blob, URL, URLSearchParams, TextEncoder, Uint8Array,
    AbortSignal, ReadableStream, setTimeout, clearTimeout, fetch: (...args) => fetcher(...args) })
  function load(file) {
    file = path.resolve(file)
    if (cache.has(file)) return cache.get(file).exports
    const module = { exports: {} }
    cache.set(file, module)
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText
    const importer = id => {
      if (Object.hasOwn(mocks, id)) return mocks[id]
      if (id === 'node:async_hooks') return require(id)
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? path.resolve('src', id.slice(2)) : path.resolve(path.dirname(file), id)
        if (Object.hasOwn(mocks, base)) return mocks[base]
        return load(fs.existsSync(base) ? base : base + '.ts')
      }
      throw Error('Unexpected import: ' + id)
    }
    vm.runInContext('(function(require, module, exports) {' + source + '\n})', context, { filename: file })(importer, module, module.exports)
    return module.exports
  }
  return { load, env }
}

async function main() {
  // Real Mongoose schemas with disconnected, simulated request connections.
  const mongoose = new (require('mongoose').Mongoose)()
  const create = mongoose.createConnection.bind(mongoose)
  const connections = []
  mongoose.createConnection = (_uri, options) => {
    assert.equal(options.maxPoolSize, 1)
    assert.equal(options.autoIndex, false)
    const connection = create()
    connection.asPromise = async () => connection
    connection.close = async () => { connection.closedByTest = true }
    connections.push(connection)
    return connection
  }
  const db = harness({ MONGODB_URI: 'mongodb://offline-test', MONGO_PER_REQUEST: 'true' }, { mongoose })
  const scope = db.load('src/lib/worker-request-scope.ts')
  const { connectDB } = db.load('src/lib/mongodb.ts')
  const User = db.load('src/models/User.ts').default
  const Product = db.load('src/models/Product.ts').default
  const Category = db.load('src/models/Category.ts').default
  const first = { values: new Map(), cleanup: [] }, second = { values: new Map(), cleanup: [] }
  await Promise.all([first, second].map(state => scope.runInWorkerRequest(state, async () => {
    const connection = await connectDB()
    await Promise.resolve()
    assert.equal(User.db, connection)
    assert.equal(Product.findOne().model.db, connection)
    assert.equal(Category.db, connection)
    assert.equal(new User({ name: 'Test', email: 'test@example.invalid' }).constructor.db, connection)
    assert.equal(connection.models.Product.schema.path('categoryId').options.ref, 'Category')
    assert.equal(connection.models.Category.db, connection, 'Populate refs use the same request connection')
    assert.equal(await connectDB(), connection, 'One connection reused within an invocation')
  })))
  assert.equal(connections.length, 2)
  assert.notEqual(connections[0], connections[1])
  await scope.closeWorkerRequest(first)
  await scope.closeWorkerRequest(second)
  assert.ok(connections.every(connection => connection.closedByTest))
  await assert.rejects(connectDB, /requires the custom Workers request scope/)
  console.log('PASS: concurrent request model isolation, populate bindings, constructors and cleanup')

  const storageData = new Map()
  let serial = Promise.resolve()
  const storage = {
    get: async key => structuredClone(storageData.get(key)),
    put: async (key, value) => { storageData.set(key, structuredClone(value)) },
    delete: async key => storageData.delete(key), setAlarm: async () => {}, deleteAll: async () => storageData.clear(),
    transaction(fn) { const run = serial.then(() => fn(storage)); serial = run.catch(() => {}); return run },
  }
  const { SecurityRateLimiter } = harness().load('src/cloudflare/security-rate-limiter.ts')
  const limiter = new SecurityRateLimiter({ storage })
  const call = async (action, limit = 5, windowMs = 900000) => (await limiter.fetch(new Request('https://test/', {
    method: 'POST', body: JSON.stringify({ action, limit, windowMs }),
  }))).json()
  const attempts = await Promise.all(Array.from({ length: 9 }, () => call('limit', 5, 3600000)))
  assert.equal(attempts.filter(item => item.success).length, 5)
  assert.ok(attempts[0].resetAt - Date.now() > 3590000)
  const restarted = new SecurityRateLimiter({ storage })
  assert.equal((await restarted.fetch(new Request('https://test/', { method: 'POST', body: JSON.stringify({ action: 'check' }) })).then(r => r.json())).locked, true)
  await call('reset')
  assert.equal((await call('check')).locked, false)
  for (let i = 0; i < 5; i++) await call('record')
  assert.equal((await call('check')).locked, true)
  const routes = harness().load('src/lib/route-rate-limits.ts')
  for (const route of ['/api/auth/reset-password', '/api/discounts/validate', '/api/orders', '/api/payments/capture', '/api/upload', '/api/reviews']) assert.ok(routes.getRateLimitConfig(route))
  assert.equal(routes.getRateLimitConfig('/api/auth/register').windowMs, 3600000)
  assert.equal(routes.getRateLimitConfig('/api/auth/session'), null)
  console.log('PASS: durable concurrent limits, persistence, account reset and original route windows')

  const mailMocks = {
    nodemailer: { createTransport: () => { throw Error('SMTP must not be selected for API mail') } },
    '@/types/jacket-customization': { JACKET_VIEWS: [], getJacketViewLabel() {}, getJacketTextSummary() {} },
  }
  let mailPayload, mailCalls = 0
  const email = harness({ EMAIL_PROVIDER: 'cloudflare-api', MIGRATION_TEST_MODE: 'true', EMAIL_TEST_RECIPIENTS: 'tester@example.invalid',
    CLOUDFLARE_ACCOUNT_ID: 'offline', CLOUDFLARE_EMAIL_API_TOKEN: 'offline' }, mailMocks, async (_url, init) => {
    mailCalls++; mailPayload = JSON.parse(init.body)
    return Response.json({ success: true, result: { queued: ['tester@example.invalid'] } })
  }).load('src/lib/email.ts')
  assert.equal((await email.sendEmail({ to: 'customer@example.invalid', subject: 'Test', html: 'Test' })).success, false)
  assert.equal(mailCalls, 0)
  assert.equal((await email.sendEmail({ to: 'tester@example.invalid', subject: 'Test', html: 'Test', attachments: [
    { filename: 'invoice.pdf', content: Buffer.from('test-pdf'), contentType: 'application/pdf' },
  ] })).success, true)
  assert.equal(mailPayload.attachments[0].content, Buffer.from('test-pdf').toString('base64'))
  assert.equal(mailPayload.attachments[0].type, 'application/pdf')
  const missing = harness({}, mailMocks).load('src/lib/email.ts')
  assert.equal((await missing.sendEmail({ to: 'test@example.invalid', subject: 'Test', html: 'Test' })).success, false)
  console.log('PASS: API-only email, recipient isolation, attachments and missing-config failure')

  const { createHash } = require('node:crypto')
  const cloudinary = harness({ CLOUDINARY_CLOUD_NAME: 'offline', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'secret' }, {}, async (url, init) => {
    assert.match(url, /\/video\/upload$/)
    const fields = init.body
    const expected = createHash('sha1').update('folder=tests&timestamp=' + fields.get('timestamp') + 'secret').digest('hex')
    assert.equal(fields.get('signature'), expected)
    assert.equal(fields.get('file').size, 4)
    return Response.json({ secure_url: 'https://example.invalid/video.mp4', public_id: 'test' })
  }).load('src/lib/cloudinary.ts')
  assert.equal((await cloudinary.uploadImage(new File(['test'], 'test.mp4'), 'tests', 'video')).publicId, 'test')
  console.log('PASS: Cloudinary signature, Blob upload and existing return shape')

  const image = harness().load('src/lib/image-loader.ts').default
  for (const src of ['/logo.webp', 'https://images.unsplash.com/test', '/test.svg']) assert.equal(image({ src, width: 640 }), src)
  assert.match(image({ src: 'https://res.cloudinary.com/test/image/upload/v1/a.jpg', width: 640 }), /w_640\/v1\/a.jpg/)
  const geo = harness().load('src/lib/geo.ts')
  assert.equal(geo.getCountryFromRequest({ headers: new Headers({ 'cf-ipcountry': 'PK', 'x-vercel-ip-country': 'US' }) }), 'PK')
  assert.equal(geo.getCountryFromRequest({ headers: new Headers({ 'cf-ipcountry': 'XX', 'x-vercel-ip-country': 'US' }) }), 'US')
  console.log('PASS: no optimizer fallback and Cloudflare/Vercel country precedence')

  const body = harness().load('src/lib/request-body.ts')
  assert.equal(await body.boundedText(new Request('https://test/', { method: 'POST', body: 'abc' }), 3), 'abc')
  await assert.rejects(() => body.boundedText(new Request('https://test/', { method: 'POST', body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('abcd')); controller.close() } }), duplex: 'half' }), 3), body.RequestBodyTooLarge)
  const form = new FormData(); form.set('file', new File(['x'.repeat(1000)], 'image.png'))
  await assert.rejects(() => body.boundedFormData(new Request('https://test/', { method: 'POST', body: form }), 100), body.RequestBodyTooLarge)
  console.log('PASS: streaming body limits without trusting Content-Length')

  const pair = await webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
  const pem = '-----BEGIN PRIVATE KEY-----\\n' + Buffer.from(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64') + '\\n-----END PRIVATE KEY-----'
  let tokenCalls = 0, sends = 0
  const fcm = harness({ FIREBASE_CLIENT_EMAIL: 'test@example.invalid', FIREBASE_PRIVATE_KEY: pem, FIREBASE_PROJECT_ID: 'offline' }, {
    '@/lib/push-config': { isPushConfigured: () => true },
  }, async (url, init) => {
    if (url.includes('oauth2')) {
      tokenCalls++
      const [header, claims, signature] = init.body.get('assertion').split('.')
      assert.equal(JSON.parse(Buffer.from(claims, 'base64url')).iss, 'test@example.invalid')
      assert.ok(await webcrypto.subtle.verify('RSASSA-PKCS1-v1_5', pair.publicKey, Buffer.from(signature, 'base64url'), Buffer.from(header + '.' + claims)))
      return Response.json({ access_token: 'offline', expires_in: 3600 })
    }
    sends++
    return JSON.parse(init.body).message.token === 'expired'
      ? Response.json({ error: { details: [{ errorCode: 'UNREGISTERED' }] } }, { status: 404 })
      : Response.json({ name: 'projects/offline/messages/' + sends })
  })
  const messaging = fcm.load('src/lib/firebase-admin.ts').adminMessaging()
  const sent = await messaging.sendEachForMulticast({ tokens: ['valid', 'expired', 'valid2'], data: { test: '1' } })
  assert.equal(sent.successCount, 2)
  assert.equal(sent.responses[1].error.code, 'messaging/registration-token-not-registered')
  await messaging.sendEachForMulticast({ tokens: ['valid'] })
  assert.equal(tokenCalls, 1)
  const fcmScope = fcm.load('src/lib/worker-request-scope.ts')
  await fcmScope.runInWorkerRequest({ values: new Map(), cleanup: [] }, async () => {
    const limited = await messaging.sendEachForMulticast({ tokens: Array.from({ length: 23 }, (_, i) => 'device-' + i) })
    assert.equal(limited.successCount, 20)
    assert.equal(limited.failureCount, 3)
    assert.equal(limited.responses[22].error.code, 'messaging/unavailable')
  })
  console.log('PASS: RS256 verification, escaped PEM, OAuth token cache and ordered FCM errors')

  let releaseBackground, cleaned = false, workerHarness, observedScope
  const workerMocks = { './.open-next/worker.js': { __esModule: true, default: {
    async fetch(_request, _env, ctx) {
      if (new URL(_request.url).pathname === '/api/legacy-product-resolution') return new Response(null, { status: 204 })
      observedScope = workerHarness.load('src/lib/worker-request-scope.ts').getWorkerRequestScope()
      assert.ok(observedScope)
      observedScope.cleanup.push(async () => { cleaned = true })
      ctx.waitUntil(new Promise(resolve => { releaseBackground = resolve }))
      return new Response('redirect', { status: 308, headers: { location: 'https://example.invalid/canonical' } })
    },
  } } }
  workerHarness = harness({}, workerMocks)
  const worker = workerHarness.load('worker.ts').default
  const tasks = [], context = { waitUntil: promise => tasks.push(promise), passThroughOnException() {} }
  const response = await worker.fetch(new Request('https://example.invalid/products/old'), { MIGRATION_TEST_MODE: 'true' }, context)
  assert.equal(response.status, 301)
  assert.equal(cleaned, false)
  await response.text()
  await Promise.resolve()
  assert.equal(cleaned, false, 'Background tasks must finish before database cleanup')
  releaseBackground()
  await Promise.all(tasks)
  assert.equal(cleaned, true)
  assert.equal(observedScope.closed, true)
  const denied = await worker.fetch(new Request('https://example.invalid/'), { MIGRATION_TEST_MODE: 'true', MONGODB_URI: 'mongodb://unconfirmed' }, context)
  assert.equal(denied.status, 503)
  console.log('PASS: Worker stream/background lifetime, legacy 301 and test-database guard')

  let leased = false, reminders = 0, completion
  const cart = { _id: 'cart-1', lastActivityAt: new Date(Date.now() - 100 * 3600000),
    remindersSent: [], userName: 'Test', userEmail: 'test@example.invalid', items: [], subtotal: 1 }
  const cartModel = {
    find: () => ({ sort() { return this }, limit: async () => [cart] }),
    findOneAndUpdate: async () => { if (leased) return null; leased = true; return cart },
    updateOne: async (_filter, update) => { completion = update },
  }
  const cronMocks = {
    'next/server': { NextResponse: Response }, '@/lib/mongodb': { connectDB: async () => true },
    '@/models/AbandonedCart': { __esModule: true, default: cartModel },
    '@/lib/email': { abandonedCartTemplate: () => ({ subject: 'test', html: 'test' }), sendEmail: async () => { reminders++; await new Promise(resolve => setTimeout(resolve, 1)); return { success: true } } },
  }
  const cronHarness = harness({ CRON_SECRET: 'offline', CRON_ENABLED: 'true' }, cronMocks)
  const cron = cronHarness.load('src/app/api/cron/abandoned-cart/route.ts')
  const cronRequest = () => new Request('https://test/', { headers: { authorization: 'Bearer offline' } })
  const sweeps = await Promise.all([cron.GET(cronRequest()), cron.GET(cronRequest())])
  assert.equal(reminders, 1, 'An overlapping sweep must not send the same reminder')
  assert.equal((await sweeps[0].json()).emailsSent + (await sweeps[1].json()).emailsSent, 1)
  assert.equal(completion.$addToSet.remindersSent, 72)
  cronHarness.env.MIGRATION_TEST_MODE = 'true'
  assert.equal((await cron.GET(cronRequest())).status, 401)
  assert.equal(reminders, 1)
  console.log('PASS: overlapping cron claims and migration-mode send denial')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
