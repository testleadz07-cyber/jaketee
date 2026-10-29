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
  const wrangler = ts.parseConfigFileTextToJson('wrangler.jsonc', fs.readFileSync('wrangler.jsonc', 'utf8')).config
  assert.equal(wrangler.main, 'cloudflare-worker.ts')
  assert.ok(wrangler.durable_objects.bindings.some(binding => binding.name === 'SECURITY_LIMITER' && binding.class_name === 'SecurityRateLimiter'))
  assert.ok(wrangler.migrations.some(migration => migration.new_sqlite_classes.includes('SecurityRateLimiter')))
  assert.ok(!wrangler.triggers?.crons?.length)
  let delegated = 0, delegatedEnv, nativeSuccess = true, durableSuccess = true, durableCalls = 0, generatedStatus = 201
  const nativeCalls = []
  const generatedHandler = { fetch: async (_request, env) => {
    delegated++; delegatedEnv = env
    return new Response('generated', { status: generatedStatus, headers: { 'Set-Cookie': 'test=value; HttpOnly', 'X-Generated': 'yes', ...(generatedStatus === 308 ? { location: '/canonical' } : {}) } })
  } }
  const entryHarness = harness({}, {
    [path.resolve('.open-next/worker.js')]: { __esModule: true, default: generatedHandler },
  })
  const configuredEntry = entryHarness.load(wrangler.main)
  const activeFetch = configuredEntry.default.fetch
  const protectionEnv = {
    LOGIN_LIMITER: { limit: async input => { nativeCalls.push(['login', input.key]); return { success: nativeSuccess } } },
    API_LIMITER: { limit: async input => { nativeCalls.push(['api', input.key]); return { success: nativeSuccess } } },
    SECURITY_LIMITER: { idFromName: name => name, get: () => ({ fetch: async (_url, init) => {
      durableCalls++
      const data = JSON.parse(init.body)
      assert.equal(data.action, 'limit')
      return Response.json({ success: durableSuccess, limit: data.limit, remaining: durableSuccess ? data.limit - 1 : 0,
        resetAt: Date.now() + data.windowMs, ...(!durableSuccess ? { retryAfterSec: 30 } : {}) })
    } }) },
  }
  const protectedRequest = path => new Request('https://example.invalid' + path, {
    headers: { 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': 'spoofed' },
  })
  const allowed = await activeFetch(protectedRequest('/api/contact'), protectionEnv, {})
  assert.equal(allowed.status, 201)
  assert.equal(await allowed.text(), 'generated')
  assert.equal(allowed.headers.get('Set-Cookie'), 'test=value; HttpOnly')
  assert.equal(allowed.headers.get('X-Generated'), 'yes')
  assert.equal(allowed.headers.get('X-RateLimit-Limit'), '5')
  assert.equal(allowed.headers.get('Cache-Control'), 'private, no-store')
  assert.equal(delegatedEnv.CLOUDFLARE_WORKER, 'true', 'Do not apply middleware memory limits a second time')
  assert.deepEqual(nativeCalls[0], ['api', '/api/contact:203.0.113.7'])
  await activeFetch(protectedRequest('/api/auth/callback/credentials'), protectionEnv, {})
  assert.deepEqual(nativeCalls[1], ['login', '/api/auth/callback/credentials:203.0.113.7'])
  nativeSuccess = false
  const beforeDeny = delegated, beforeDurable = durableCalls
  const nativeDenied = await activeFetch(protectedRequest('/api/contact'), protectionEnv, {})
  assert.equal(nativeDenied.status, 429)
  assert.equal(nativeDenied.headers.get('Retry-After'), '60')
  assert.equal(durableCalls, beforeDurable)
  nativeSuccess = true; durableSuccess = false
  const durableDenied = await activeFetch(protectedRequest('/api/contact'), protectionEnv, {})
  assert.equal(durableDenied.status, 429)
  assert.equal(durableDenied.headers.get('Retry-After'), '30')
  assert.equal(delegated, beforeDeny, 'Denied requests must never invoke application code')
  assert.equal((await activeFetch(protectedRequest('/api/contact'), {}, {})).status, 503)
  assert.equal((await activeFetch(protectedRequest('/api/contact'), { API_LIMITER: protectionEnv.API_LIMITER }, {})).status, 503)
  const callsBeforeExempt = nativeCalls.length
  for (const path of ['/shop', '/api/auth/session', '/api/auth/csrf', '/api/webhooks/stripe', '/api/webhooks/paypal', '/api/cron/abandoned-cart']) {
    assert.equal((await activeFetch(protectedRequest(path), {}, {})).status, 201)
  }
  assert.equal((await activeFetch(new Request('https://example.invalid/api/contact', { method: 'OPTIONS' }), {}, {})).status, 201)
  assert.equal(nativeCalls.length, callsBeforeExempt)
  assert.equal(configuredEntry.SecurityRateLimiter, entryHarness.load('src/cloudflare/security-rate-limiter.ts').SecurityRateLimiter)
  assert.equal(configuredEntry.PublicCacheTags, entryHarness.load('src/cloudflare/public-cache-tags.ts').PublicCacheTags)
  assert.ok(wrangler.durable_objects.bindings.some(binding => binding.name === 'PUBLIC_CACHE_TAGS'))
  generatedStatus = 308
  assert.equal((await activeFetch(protectedRequest('/products/old'), {}, {})).status, 301)
  assert.equal((await activeFetch(protectedRequest('/customize'), {}, {})).status, 308)
  generatedStatus = 201
  assert.equal((await activeFetch(new Request('https://jaketee.testleadz07.workers.dev/shop'), {}, {})).headers.get('X-Robots-Tag'), 'noindex, nofollow')
  console.log('PASS: active entry enforces native/durable limits, preserves generated responses, exempts provider/session traffic and has no cron')

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

  // Exercise the actual OpenNext wrapper selected by the generated Worker.
  const standardWrapper = (await import('@opennextjs/aws/overrides/wrappers/cloudflare-node.js')).default
  const adapter = harness({ MONGODB_URI: 'mongodb://offline-test' }, {
    mongoose,
    '@opennextjs/aws/overrides/wrappers/cloudflare-node.js': { __esModule: true, default: standardWrapper },
  })
  const adapterScope = adapter.load('src/lib/worker-request-scope.ts')
  const adapterDb = adapter.load('src/lib/mongodb.ts')
  const adapterProduct = adapter.load('src/models/Product.ts').default
  const wrapper = adapter.load('src/cloudflare/request-wrapper.ts').default
  const activeConnections = [], releases = [], backgroundChecks = [], lifecycle = []
  const adaptedFetch = await wrapper.wrapper(async (_event, options) => {
    const connection = await adapterDb.connectDB()
    activeConnections.push(connection)
    assert.equal(adapterProduct.db, connection)
    const state = adapterScope.getWorkerRequestScope()
    assert.equal(state.values.get('request-headers').get('cf-connecting-ip'), `203.0.113.${new URL(_event).searchParams.get('id')}`)
    const deferred = new Promise(resolve => releases.push(resolve))
    options.waitUntil(deferred.then(async () => {
      assert.equal(adapterScope.getWorkerRequestScope(), state)
      assert.equal(adapterProduct.db, connection)
      assert.ok(!connection.closedByTest, 'Background DB work must finish before cleanup')
      backgroundChecks.push(connection)
    }))
    const writable = options.streamCreator.writeHeaders({ statusCode: 200, headers: {}, cookies: [] })
    writable.end('products')
  }, { convertFrom: async request => request.url })
  const responses = await Promise.all([1, 2].map(id => adaptedFetch(new Request(`https://example.invalid/shop?id=${id}`, { headers: { 'cf-connecting-ip': `203.0.113.${id}` } }), {}, {
    waitUntil(promise) { lifecycle.push(promise) },
  })))
  assert.notEqual(activeConnections[0], activeConnections[1])
  assert.deepEqual(await Promise.all(responses.map(response => response.text())), ['products', 'products'])
  assert.ok(activeConnections.every(connection => !connection.closedByTest))
  releases.forEach(resolve => resolve())
  await Promise.all(lifecycle)
  assert.equal(backgroundChecks.length, 2)
  assert.ok(activeConnections.every(connection => connection.closedByTest))

  // Handler failure, body cancellation, and null-body responses also clean up.
  const scopedFetch = adapter.load('src/lib/scoped-worker-fetch.ts').scopedWorkerFetch
  for (const mode of ['failure', 'cancel', 'empty']) {
    const tasks = []
    let connection
    const fetch = scopedFetch(async () => {
      connection = await adapterDb.connectDB()
      if (mode === 'failure') throw Error('test failure')
      return mode === 'empty' ? new Response(null, { status: 204 }) : new Response(new ReadableStream())
    })
    const result = fetch(new Request('https://example.invalid/shop'), {}, { waitUntil: promise => tasks.push(promise) })
    if (mode === 'failure') await assert.rejects(result, /test failure/)
    else { const response = await result; if (response.body) await response.body.cancel() }
    await Promise.all(tasks)
    assert.ok(connection.closedByTest, `${mode} must close its DB connection`)
  }
  console.log('PASS: generated OpenNext wrapper isolates concurrent MongoDB requests and cleans up streams/background/errors')

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
  let cfGeo
  const geo = harness({}, { '@opennextjs/cloudflare': { getCloudflareContext: () => ({ cf: cfGeo }) } }).load('src/lib/geo.ts')
  assert.equal(geo.getCountryFromRequest({ headers: new Headers({ 'cf-ipcountry': 'PK', 'x-vercel-ip-country': 'US' }) }), 'PK')
  assert.equal(geo.getCountryFromRequest({ headers: new Headers({ 'cf-ipcountry': 'XX', 'x-vercel-ip-country': 'US' }) }), undefined)
  cfGeo = { country: 'US', regionCode: 'TX', city: 'Austin', postalCode: '78701' }
  const cloudflareGeo = geo.getGeoFromRequest({ headers: new Headers({ 'cf-ipcountry': 'PK', 'x-vercel-ip-city': 'Spoofed' }) })
  assert.equal(cloudflareGeo.country, 'US')
  assert.equal(cloudflareGeo.city, 'Austin')
  assert.equal(cloudflareGeo.region, 'TX')
  assert.equal(cloudflareGeo.postalCode, '78701')
  const clientIp = harness().load('src/lib/rate-limit-memory.ts').getClientIp
  assert.equal(clientIp({ headers: new Headers({ 'cf-connecting-ip': '2001:db8::1', 'x-forwarded-for': '1.2.3.4' }) }), '2001:db8::1')
  assert.equal(clientIp({ headers: new Headers({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '1.2.3.5' }) }), 'unknown')
  console.log('PASS: image loading and Cloudflare-only IP/location metadata; forwarded headers ignored')

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
  const sendsBeforeDeadline = sends
  const expiredDelivery = await messaging.sendEachForMulticast({ tokens: ['valid'], deadline: Date.now() - 1 })
  assert.equal(expiredDelivery.failureCount, 1)
  assert.equal(sends, sendsBeforeDeadline, 'Expired background work must not start another provider request')
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
