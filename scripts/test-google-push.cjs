const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks = {}, globals = {}) {
  const filename = path.resolve(file)
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
  const module = { exports: {} }
  const localRequire = name => {
    if (name === '@/lib/mongodb' && file.startsWith('src/models/')) return { requestScopedModel: model => model }
    if (Object.hasOwn(mocks, name)) return mocks[name]
    if (name === '@/lib/notifications' && file !== 'src/lib/notifications.ts') return { createNotification: async () => {} }
    if (name === '@/models/User' && mocks[name] === undefined) return load('src/models/User.ts', mocks)
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks, globals)
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), `${name}.ts`), mocks, globals)
    return require(name)
  }
  vm.runInNewContext(`(function(require,module,exports){${source}\n})`, { process, console, Date, URL, setTimeout, clearTimeout, AbortController, Buffer, ...globals })(localRequire, module, module.exports)
  return module.exports
}
const query = value => ({ select() { return this }, lean: async () => value, limit: async () => value })
const profile = { sub: 'google-1', email: 'Customer@Example.com', email_verified: true, name: 'Customer' }
let passed = 0
async function test(name, fn) { await fn(); passed++; console.log(`PASS ${name}`) }

async function main() {
  await test('Google completion: routes customers/admins without visiting login and preserves safe return paths', async () => {
    const { NextRequest } = require('next/server')
    const helper = load('src/lib/auth-redirect.ts')
    assert.equal(helper.getGoogleCompletionUrl(), '/auth/complete')
    assert.equal(helper.getPostSignInDestination('customer'), '/profile')
    assert.equal(helper.getPostSignInDestination('admin'), '/admin/dashboard')
    assert.equal(helper.getPostSignInDestination('customer', '/checkout?mode=buy-now'), '/checkout?mode=buy-now')
    for (const unsafe of ['https://evil.example', '//evil.example', '/\\evil.example', '/x/..//evil.example', '/login', '/register', '/auth/complete/', '/api/auth/signin/google', '/%6cogin', '/%5cevil.example']) assert.equal(helper.getSafeAuthCallback(unsafe), null, unsafe)
    assert.equal(helper.getPostSignInDestination('customer', '/admin/dashboard'), '/profile')
    assert.equal(helper.getPostSignInDestination('customer', '/%61dmin/dashboard'), '/profile')
    let token = { userId: 'fixture-user', role: 'customer' }
    const route = load('src/app/auth/complete/route.ts', { 'next-auth/jwt': { getToken: async () => token } })
    const expectedOrigin = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').origin
    const request = query => new NextRequest(`http://localhost:3000/auth/complete${query || ''}`)
    let response = await route.GET(request())
    assert.equal(response.status, 307)
    assert.equal(response.headers.get('location'), `${expectedOrigin}/profile`)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    token = { userId: 'fixture-admin', role: 'admin' }
    assert.equal((await route.GET(request())).headers.get('location'), `${expectedOrigin}/admin/dashboard`)
    token = { userId: 'fixture-user', role: 'customer' }
    assert.equal((await route.GET(request('?callbackUrl=%2Fcheckout'))).headers.get('location'), `${expectedOrigin}/checkout`)
    assert.equal((await route.GET(request('?callbackUrl=%2Fadmin%2Fdashboard'))).headers.get('location'), `${expectedOrigin}/profile`)
    token = null
    assert.equal((await route.GET(request('?callbackUrl=%2Fcheckout'))).headers.get('location'), `${expectedOrigin}/login?callbackUrl=%2Fcheckout`)
  })
  await test('Push registration: stalled stages time out and worker listeners are cleaned up', async () => {
    const { withPushTimeout, waitForPushWorker } = load('src/lib/push-registration.ts')
    await assert.rejects(() => withPushTimeout(new Promise(() => {}), 'Firebase timed out', 5), /Firebase timed out/)
    const registration = new EventTarget()
    let attached = 0
    const add = registration.addEventListener.bind(registration), remove = registration.removeEventListener.bind(registration)
    registration.addEventListener = (...args) => { attached++; add(...args) }
    registration.removeEventListener = (...args) => { attached--; remove(...args) }
    await assert.rejects(() => waitForPushWorker(registration, 5), /worker took too long/)
    assert.equal(attached, 0)
    registration.installing = Object.assign(new EventTarget(), { state: 'installing' })
    const pending = waitForPushWorker(registration, 1000)
    registration.active = registration.installing
    registration.active.state = 'activated'
    registration.active.dispatchEvent(new Event('statechange'))
    await pending
    assert.equal(attached, 0)
  })
  await test('Push registration: simultaneous settings/sync callers share one operation and can retry after failure', async () => {
    const { createPushRegistration } = load('src/lib/push-registration.ts')
    let calls = 0, complete
    const messages = []
    const register = createPushRegistration(async progress => { calls++; progress('Connecting…'); return new Promise(resolve => { complete = resolve }) })
    const first = register(message => messages.push(message))
    const second = register(message => messages.push(message))
    await Promise.resolve()
    assert.equal(calls, 1)
    complete('token')
    assert.deepEqual(await Promise.all([first, second]), ['token', 'token'])
    assert.ok(messages.includes('Connecting…'))
    let attempts = 0
    const retry = createPushRegistration(async () => { if (!attempts++) throw new Error('Temporary failure'); return 'retried-token' })
    await assert.rejects(retry, /Temporary failure/)
    assert.equal(await retry(), 'retried-token')
  })
  await test('Push client: uses its activated worker, reports progress and saves exactly once', async () => {
    const keys = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_VAPID_KEY']
    const previous = keys.map(key => process.env[key])
    keys.forEach(key => { process.env[key] = 'test-value' })
    try {
      let registrations = 0, tokens = 0, saved = 0
      const worker = Object.assign(new EventTarget(), { active: { state: 'activated' } })
      const serviceWorker = { register: async () => { registrations++; return worker }, get ready() { throw new Error('Global serviceWorker.ready must not be awaited') } }
      const sdk = { isSupported: async () => true, getMessaging: () => ({}), getToken: async (_, options) => { tokens++; assert.equal(options.serviceWorkerRegistration, worker); return 'test-device-token' } }
      const globals = { window: { isSecureContext: true, PushManager() {} }, navigator: { serviceWorker }, fetch: async () => { saved++; return { ok: true, json: async () => ({ success: true }) } } }
      const client = load('src/lib/firebase-client.ts', { 'firebase/app': { getApps: () => [], initializeApp: () => ({}) }, 'firebase/messaging': sdk }, globals)
      const messages = []
      await Promise.all([client.registerPushDevice(value => messages.push(value)), client.registerPushDevice()])
      assert.equal(registrations, 1); assert.equal(tokens, 1); assert.equal(saved, 1)
      assert.ok(messages.includes('Connecting this browser to Firebase…'))
      assert.ok(messages.includes('Saving this device…'))
    } finally { keys.forEach((key, i) => { if (previous[i] === undefined) delete process.env[key]; else process.env[key] = previous[i] }) }
  })
  await test('Google: verified profile, customer signup, stable MongoDB identity', async () => {
    let insertion
    const model = { init: async () => {}, findOne: async () => null, find: () => query([]), findOneAndUpdate: async (_, update) => { insertion = update.$setOnInsert; return { ...insertion, _id: 'mongo-1' } } }
    const { resolveGoogleUser } = load('src/lib/google-auth.ts', { '@/models/User': model, '@/lib/mongodb': { connectDB: async () => true } })
    const user = await resolveGoogleUser(profile)
    assert.equal(user._id, 'mongo-1'); assert.equal(insertion.role, 'customer'); assert.equal(insertion.email, 'customer@example.com'); assert.equal(insertion.password, undefined)
    await assert.rejects(() => resolveGoogleUser({ ...profile, email_verified: false }), /GoogleEmailUnverified/)
  })
  await test('Google: password account cannot be silently linked; authenticated owner can link', async () => {
    let saved = false
    const existing = { _id: 'mongo-1', isActive: true, save: async () => { saved = true } }
    const { resolveGoogleUser } = load('src/lib/google-auth.ts', { '@/models/User': { init: async () => {}, findOne: async () => null, find: () => query([existing]) }, '@/lib/mongodb': { connectDB: async () => true } })
    await assert.rejects(() => resolveGoogleUser(profile), /GoogleLinkRequired/)
    await assert.rejects(() => resolveGoogleUser(profile, 'someone-else'), /GoogleLinkRequired/)
    assert.equal((await resolveGoogleUser(profile, 'mongo-1')).googleId, 'google-1'); assert.ok(saved)
  })
  await test('Google: disabled accounts, cross-account linking and duplicate email rejected', async () => {
    const mocks = { '@/models/User': { init: async () => {}, findOne: async () => ({ _id: 'mongo-1', isActive: false }) }, '@/lib/mongodb': { connectDB: async () => true } }
    const { resolveGoogleUser } = load('src/lib/google-auth.ts', mocks)
    await assert.rejects(() => resolveGoogleUser(profile), /GoogleAccountDisabled/)
    await assert.rejects(() => resolveGoogleUser(profile, 'mongo-2'), /GoogleAccountConflict/)
    mocks['@/models/User'] = { init: async () => {}, findOne: async () => null, find: () => query([{ _id: 'mongo-1' }, { _id: 'mongo-2' }]) }
    await assert.rejects(() => load('src/lib/google-auth.ts', mocks).resolveGoogleUser(profile, 'mongo-1'), /GoogleLinkRequired/)
  })
  await test('User schema: Google-only accounts valid, credentials accounts still require password', async () => {
    const User = load('src/models/User.ts').default
    assert.equal(new User({ name: 'Test', email: 'test@example.com', googleId: 'google-1' }).validateSync(), undefined)
    assert.ok(new User({ name: 'Test', email: 'test@example.com' }).validateSync()?.errors.password)
    const { comparePassword, hashPassword } = load('src/lib/auth.ts')
    assert.equal(await comparePassword('anything', undefined), false)
    const hash = await hashPassword('strong-test-password')
    assert.equal(await comparePassword('strong-test-password', hash), true)
    assert.equal(await comparePassword('wrong-password', hash), false)
  })
  await test('NextAuth: Google maps role/ID, JWT receives login session before signIn event', async () => {
    let closed = false, detached = false
    const login = { logoutAt: null, loginAt: new Date(), save: async () => { closed = true } }
    const mocks = {
      'next-auth': { getServerSession: async () => null },
      '@/lib/google-auth': { resolveGoogleUser: async () => ({ _id: 'mongo-user', role: 'customer', email: 'test@example.com', name: 'Test' }) },
      '@/lib/mongodb': { connectDB: async () => true }, '@/lib/turnstile': { verifyTurnstile: async () => true },
      '@/models/LoginSession': { create: async data => { assert.equal(data.userId, 'mongo-user'); return { _id: 'login-session' } }, findById: async () => login },
      '@/models/Activity': { create: async () => {} }, '@/models/PushDevice': { deleteMany: async () => { detached = true } },
    }
    const { authOptions } = load('src/lib/auth-options.ts', mocks)
    const user = { id: 'google-original-id' }
    assert.equal(await authOptions.callbacks.signIn({ user, account: { provider: 'google' }, profile }), true)
    const token = await authOptions.callbacks.jwt({ token: {}, user, account: { provider: 'google' } })
    assert.equal(token.userId, 'mongo-user'); assert.equal(token.role, 'customer'); assert.equal(token.loginSessionId, 'login-session')
    await authOptions.events.signOut({ token }); assert.ok(closed); assert.ok(detached)
  })
  await test('Push access survives analytics page-end but actual sign-out revokes it', async () => {
    const { NextRequest } = require('next/server')
    const identity = { id: 'admin-user', loginSessionId: 'admin-login' }
    const login = { _id: 'admin-login', userId: 'admin-user', loginAt: new Date(), save: async () => {} }
    const mocks = {
      'next-auth': { getServerSession: async () => ({ user: identity }) },
      'next-auth/jwt': { getToken: async () => ({ userId: identity.id, loginSessionId: identity.loginSessionId, exp: Math.floor(Date.now() / 1000) + 3600 }) },
      '@/lib/auth-options': { authOptions: {} },
      '@/lib/mongodb': { connectDB: async () => true },
      '@/models/User': { findOne: () => query({ _id: 'admin-user' }) },
      '@/models/LoginSession': {
        findById: async () => login,
        findOne: filter => query(Object.entries(filter).every(([key, value]) => value == null ? login[key] == null : login[key] === value) ? login : null),
      },
      '@/models/PushDevice': { deleteMany: async () => {} },
      '@/lib/push-config': { isPushConfigured: () => true },
      '@/lib/push-notifications': { sendAdminPush: async () => ({ successCount: 1 }) },
      '@/lib/turnstile': { verifyTurnstile: async () => true },
    }
    const end = load('src/app/api/sessions/end/route.ts', mocks)
    await end.POST(new NextRequest('https://www.jacketee.com/api/sessions/end', { method: 'POST' }))
    assert.ok(login.logoutAt, 'page-end records analytics logoutAt')
    const push = load('src/app/api/admin/push/route.ts', mocks)
    const request = () => new NextRequest('https://www.jacketee.com/api/admin/push')
    assert.equal((await push.GET(request())).status, 200, 'page close must not revoke authenticated push access')
    delete mocks['@/lib/auth-options']
    const { authOptions } = load('src/lib/auth-options.ts', mocks)
    await authOptions.events.signOut({ token: { loginSessionId: 'admin-login' } })
    assert.ok(login.revokedAt, 'actual sign-out must revoke even an analytics-ended session')
    assert.equal((await push.GET(request())).status, 401, 'signed-out login must no longer manage push')
  })
  await test('Push: absent configuration does not send or query devices', async () => {
    const { sendAdminPush } = load('src/lib/push-notifications.ts', { '@/lib/firebase-admin': { isPushConfigured: () => false } })
    assert.equal((await sendAdminPush({ id: '1', type: 'test' })).configured, false)
  })
  await test('Push: session/role filters, multicast batching, invalid-token cleanup, generic payload', async () => {
    const devices = Array.from({ length: 501 }, (_, i) => ({ _id: String(i), token: `token-${i}` }))
    let batches = [], removed = [], deviceFilter
    const { sendAdminPush } = load('src/lib/push-notifications.ts', {
      '@/lib/firebase-admin': { isPushConfigured: () => true, adminMessaging: () => ({ sendEachForMulticast: async message => {
        batches.push(message); return { successCount: message.tokens.length - 1, failureCount: 1, responses: message.tokens.map((_, i) => i ? {} : { error: { code: 'messaging/registration-token-not-registered' } }) }
      } }) },
      '@/models/User': { find: filter => { assert.equal(filter.role, 'admin'); assert.equal(filter.isActive.$ne, false); return query([{ _id: 'admin' }]) } },
      '@/models/LoginSession': { find: filter => {
        assert.equal(filter.revokedAt, null)
        assert.equal(Object.hasOwn(filter, 'logoutAt'), false, 'analytics page-end must not suppress background delivery')
        const sessions = [{ _id: 'active-session', logoutAt: new Date() }, { _id: 'revoked-session', revokedAt: new Date() }]
        return query(sessions.filter(s => s.revokedAt == null))
      } },
      '@/models/PushDevice': { find: filter => { deviceFilter = filter; return query(devices) }, deleteMany: async filter => { removed.push(filter) } },
    })
    const result = await sendAdminPush({ id: 'event-1', type: 'contact_form', link: 'https://evil.example' })
    assert.equal(batches.length, 2); assert.equal(batches[0].tokens.length, 500); assert.equal(result.failureCount, 2); assert.equal(removed.length, 2)
    assert.equal(deviceFilter.loginSessionId.$in[0], 'active-session'); assert.equal(batches[0].data.url, '/admin/notifications'); assert.equal(batches[0].notification, undefined)
  })
  await test('Notification persistence: duplicate order events are skipped; push failure does not reject business action', async () => {
    let count = 0, sends = 0
    const { createNotification, notifyOrder } = load('src/lib/notifications.ts', {
      '@/lib/mongodb': { connectDB: async () => true },
      '@/models/Notification': { init: async () => {}, create: async () => { if (count++) throw { code: 11000 }; return { _id: 'n-1' } } },
      '@/lib/notification-delivery': { scheduleNotificationPush: () => { sends++ } },
    })
    await notifyOrder({ _id: 'order-1', orderNumber: 'LX-1' }, true)
    await notifyOrder({ _id: 'order-1', orderNumber: 'LX-1' }, true)
    assert.equal(sends, 1)
    await createNotification({ type: 'contact_form', title: 'Test', message: 'Test' })
    const failingPush = load('src/lib/notifications.ts', {
      '@/lib/mongodb': { connectDB: async () => true },
      '@/models/Notification': { init: async () => {}, create: async () => ({ _id: 'saved' }) },
      '@/lib/notification-delivery': { scheduleNotificationPush: () => { throw new Error('Simulated scheduling outage') } },
    })
    const originalError = console.error
    try {
      console.error = () => {}
      await assert.doesNotReject(() => failingPush.createNotification({ type: 'contact_form', title: 'Test', message: 'Test' }))
    } finally { console.error = originalError }
  })
  await test('Push API: rejects unauthenticated, cross-origin, non-admin, malformed requests; registration uses server identity', async () => {
    const { NextRequest } = require('next/server')
    let session = null, admin = true, saved
    const mocks = {
      'next-auth/jwt': { getToken: async () => session ? ({ userId: session.user.id, loginSessionId: session.user.loginSessionId, exp: Math.floor(Date.now() / 1000) + 3600 }) : null },
      'next-auth': { getServerSession: async () => session }, '@/lib/auth-options': { authOptions: {} }, '@/lib/mongodb': { connectDB: async () => true },
      '@/models/User': { init: async () => {}, findOne: () => query(admin ? { _id: 'server-user' } : null) },
      '@/models/LoginSession': { findOne: () => query({ _id: 'server-login' }) },
      '@/models/PushDevice': { findOneAndUpdate: async (_, update) => { saved = update.$set } },
      '@/lib/push-config': { isPushConfigured: () => true }, '@/lib/push-notifications': { sendAdminPush: async () => ({ successCount: 1 }) },
    }
    const route = load('src/app/api/admin/push/route.ts', mocks)
    const request = (body, origin = 'https://www.jacketee.com') => new NextRequest('https://www.jacketee.com/api/admin/push', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    assert.equal((await route.POST(request({}))).status, 401)
    session = { user: { id: 'server-user', loginSessionId: 'server-login' }, expires: new Date(Date.now() + 86400000).toISOString() }
    assert.equal((await route.POST(request({}, 'https://evil.example'))).status, 403)
    admin = false; assert.equal((await route.POST(request({}))).status, 403); admin = true
    assert.equal((await route.POST(request({ token: 'bad' }))).status, 400)
    assert.equal((await route.POST(request({ token: 'valid-registration-token-12345', userId: 'attacker' }))).status, 200)
    assert.equal(saved.userId, 'server-user'); assert.equal(saved.loginSessionId, 'server-login')
  })
  await test('Push registration: App Router session without expires saves the verified JWT expiry', async () => {
    const { NextRequest } = require('next/server')
    const identity = { id: 'server-user', loginSessionId: 'server-login' }
    const expiration = Math.floor(Date.now() / 1000) + 3600
    let jwt = { userId: identity.id, loginSessionId: identity.loginSessionId, exp: expiration }, saves = 0
    const route = load('src/app/api/admin/push/route.ts', {
      'next-auth': { getServerSession: async () => ({ user: identity }) }, // Real App Router shape: NO expires.
      'next-auth/jwt': { getToken: async () => jwt },
      '@/lib/auth-options': { authOptions: {} }, '@/lib/mongodb': { connectDB: async () => true },
      '@/models/User': { findOne: filter => query(filter._id === identity.id ? { _id: identity.id } : null) },
      '@/models/LoginSession': { findOne: () => query({ _id: identity.loginSessionId }) },
      '@/lib/push-config': { isPushConfigured: () => true },
      '@/lib/push-notifications': { sendAdminPush: async () => ({ successCount: 1 }) },
      '@/models/PushDevice': { findOneAndUpdate: async (_, update) => {
        assert.equal(update.$set.expiresAt.getTime(), expiration * 1000)
        assert.ok(Number.isFinite(update.$set.expiresAt.getTime()))
        saves++
      } },
    })
    const request = () => new NextRequest('https://www.jacketee.com/api/admin/push', { method: 'POST', headers: { origin: 'https://www.jacketee.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'valid-device-registration-token' }) })
    assert.equal((await route.POST(request())).status, 200)
    jwt = { ...jwt, exp: 1 }
    assert.equal((await route.POST(request())).status, 401)
    jwt = { ...jwt, exp: expiration, userId: 'different-user' }
    assert.equal((await route.POST(request())).status, 403)
    assert.equal(saves, 1, 'expired or mismatched JWT cannot save a device')
  })
  await test('Push API: real signed NextAuth cookie authenticates; corrupted cookie cannot save a device', async () => {
    const { NextRequest } = require('next/server')
    const { encode, decode } = require('next-auth/jwt')
    const oldSecret = process.env.NEXTAUTH_SECRET, oldUrl = process.env.NEXTAUTH_URL
    process.env.NEXTAUTH_SECRET = 'isolated-auth-regression-secret'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    try {
      const cookie = await encode({ secret: process.env.NEXTAUTH_SECRET, token: { userId: 'fixture-user', loginSessionId: 'fixture-login' }, maxAge: 3600 })
      const decoded = await decode({ secret: process.env.NEXTAUTH_SECRET, token: cookie })
      let saved = 0
      const route = load('src/app/api/admin/push/route.ts', {
        '@/lib/mongodb': { connectDB: async () => true },
        '@/lib/push-config': { isPushConfigured: () => true },
        '@/models/User': { findOne: filter => { assert.equal(filter._id, 'fixture-user'); assert.equal(filter.role, 'admin'); return query({ _id: 'fixture-user' }) } },
        '@/models/LoginSession': { findOne: filter => { assert.equal(filter._id, 'fixture-login'); return query({ _id: 'fixture-login' }) } },
        '@/models/PushDevice': { findOneAndUpdate: async (_, update) => { assert.equal(update.$set.expiresAt.getTime(), decoded.exp * 1000); saved++ } },
      })
      const request = (method, signedCookie = cookie) => new NextRequest('http://localhost:3000/api/admin/push', { method, headers: { origin: 'http://localhost:3000', cookie: `next-auth.session-token=${signedCookie}`, 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: JSON.stringify({ token: 'fixture-registration-token-12345' }) } : {}) })
      assert.equal((await route.GET(request('GET'))).status, 200)
      assert.equal((await route.POST(request('POST'))).status, 200)
      assert.equal((await route.POST(request('POST', `corrupted-${cookie}`))).status, 401)
      assert.equal(saved, 1)
    } finally {
      if (oldSecret === undefined) delete process.env.NEXTAUTH_SECRET; else process.env.NEXTAUTH_SECRET = oldSecret
      if (oldUrl === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = oldUrl
    }
  })
  await test('Push API: stalled database returns a specific 503 without loading login or sending SDKs', async () => {
    const { NextRequest } = require('next/server')
    const mocks = {
      'next-auth/jwt': { getToken: async () => ({ userId: 'admin', loginSessionId: 'login', exp: Math.floor(Date.now() / 1000) + 3600 }) },
      '@/lib/mongodb': { connectDB: () => new Promise(() => {}) },
      '@/lib/push-config': { isPushConfigured: () => true },
    }
    Object.defineProperty(mocks, '@/lib/auth-options', { get() { throw new Error('Settings must not load Google login') } })
    Object.defineProperty(mocks, '@/lib/firebase-admin', { get() { throw new Error('Settings must not load Firebase Admin') } })
    const route = load('src/app/api/admin/push/route.ts', mocks, { setTimeout: fn => setTimeout(fn, 5) })
    const response = await route.GET(new NextRequest('https://www.jacketee.com/api/admin/push'))
    assert.equal(response.status, 503)
    assert.match((await response.json()).error, /database did not respond/)
  })
  await test('Push client: server timeout identifies the exact operation and releases the request', async () => {
    const helper = load('src/lib/push-registration.ts', {}, {
      setTimeout: fn => setTimeout(fn, 5),
      fetch: (_, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(new Error('Aborted')))),
    })
    await assert.rejects(() => helper.pushRequest('GET'), /Loading notification settings took too long/)
    await assert.rejects(() => helper.pushRequest('POST', 'test-token'), /Saving this device took too long/)
    await assert.rejects(() => helper.pushRequest('PATCH', 'test-token'), /Sending the test notification took too long/)
  })
  await test('Service worker: background display, foreground forwarding, safe click destination', async () => {
    const events = {}, shown = [], messages = [], opened = []
    let windows = []
    const self = { location: { origin: 'https://www.jacketee.com' }, addEventListener: (name, handler) => { events[name] = handler }, registration: { showNotification: async (...args) => shown.push(args) }, clients: { matchAll: async () => windows, openWindow: async url => opened.push(url) } }
    vm.runInNewContext(fs.readFileSync('public/firebase-messaging-sw.js', 'utf8'), { self, URL })
    async function push(data) { let done; events.push({ data: { json: () => ({ data }) }, waitUntil: promise => { done = promise } }); await done }
    await push({ id: 'unique-1', title: 'Test', body: 'Message', url: '/admin/orders/1' }); assert.equal(shown[0][1].tag, 'unique-1')
    windows = [{ visibilityState: 'visible', url: 'https://www.jacketee.com/admin/notifications', postMessage: value => messages.push(value) }]
    await push({ body: 'Foreground' }); assert.equal(shown.length, 2); assert.equal(messages[0].kind, 'jacketee-push')
    windows = []
    let done; events.notificationclick({ notification: { close() {}, data: { url: 'https://evil.example' } }, waitUntil: promise => { done = promise } }); await done
    assert.equal(opened[0], 'https://www.jacketee.com/admin/notifications')
  })
  console.log(`\n${passed} Google auth and push behavior tests passed.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
