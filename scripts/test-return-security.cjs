const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const { webcrypto } = require('node:crypto')

function load(file, mocks, globals = {}) {
  const module = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})', { Response, Request, crypto: webcrypto, console, ...globals })(id => {
    if (!(id in mocks)) throw Error('Unexpected import ' + id)
    return mocks[id]
  }, module, module.exports)
  return module.exports
}
async function main() {
  let now = Date.now()
  class Clock extends Date { static now() { return now } }
  const stores = new Map()
  const { SecurityRateLimiter } = load('src/cloudflare/security-rate-limiter.ts', {}, { Date: Clock })
  const gate = async (key, action, details = {}) => {
    if (!stores.has(key)) {
      const map = new Map(); let pending = Promise.resolve()
      const storage = {
        get: async key => structuredClone(map.get(key)), put: async (key, value) => map.set(key, structuredClone(value)),
        delete: async key => map.delete(key), deleteAll: async () => map.clear(), setAlarm: async () => {},
        transaction: fn => { const result = pending.then(() => fn(storage)); pending = result.catch(() => {}); return result },
      }
      stores.set(key, new SecurityRateLimiter({ storage }))
    }
    return (await stores.get(key).fetch(new Request('https://internal/', { method: 'POST', body: JSON.stringify({ action, ...details }) }))).json()
  }
  const records = new Map()
  const order = { _id: '123456789012345678901234', orderNumber: 'JT-123', userId: 'owner', userEmail: 'Owner@Example.com' }
  let queryCount = 0
  const matches = (row, query) => query.orderId.$in.includes(row.orderId) && (!query.status || row.status === query.status) &&
    (!query.createdAt || row.createdAt > query.createdAt.$gt)
  const query = value => ({ select() { return this }, limit() { return this }, lean: async () => value })
  const api = load('src/lib/return-request.ts', {
    'server-only': {}, '@/lib/mongodb': { connectDB: async () => true },
    '@/models/Order': { default: { findOne: filter => { queryCount++; return query(filter.orderNumber === order.orderNumber ? order : null) } } },
    '@/models/RefundRequest': { default: {
      exists: async filter => [...records.values()].some(row => matches(row, filter)),
      find: filter => query([...records.values()].filter(row => matches(row, filter)).slice(0, 3)),
      updateOne: async (filter, update) => {
        if (records.has(filter._id)) return { upsertedCount: 0 }
        records.set(filter._id, { _id: filter._id, ...update.$setOnInsert }); return { upsertedCount: 1 }
      },
    } }, './return-submission-gate': { returnSubmissionGate: gate },
  }, { Date: Clock })
  const input = { orderId: 'JT-123', userEmail: 'owner@example.com', userName: '', reason: 'The jacket does not fit correctly.', turnstileToken: 'token' }
  assert.equal(api.parseReturnInput({ ...input, userEmail: ' OWNER@EXAMPLE.COM ' }).userEmail, input.userEmail)
  for (const invalid of [{ ...input, role: 'admin' }, { ...input, reason: 'short' }, { ...input, orderId: { $ne: null } }, { ...input, userName: 'x'.repeat(101) }]) {
    assert.throws(() => api.parseReturnInput(invalid))
  }
  const wrongEmail = await api.submitReturn({ ...input, userEmail: 'wrong@example.com' })
  const missingOrder = await api.submitReturn({ ...input, orderId: 'missing' })
  assert.equal(wrongEmail.error, missingOrder.error)
  assert.equal(records.size, 0)
  const parallel = await Promise.all(Array.from({ length: 20 }, () => api.submitReturn(input)))
  assert.equal(parallel.filter(result => result.inserted).length, 1)
  assert.equal(records.size, 1, 'Parallel submissions create only one record')
  assert.equal((await api.submitReturn(input)).status, 409)
  for (const row of records.values()) row.status = 'rejected'
  assert.equal((await api.submitReturn({ ...input, userEmail: '' }, { id: 'owner' })).status, 201, 'Signed-in owner may omit email')
  for (const row of records.values()) row.status = 'rejected'
  assert.equal((await api.submitReturn(input)).status, 201)
  for (const row of records.values()) row.status = 'rejected'
  assert.equal((await api.submitReturn(input)).status, 429, 'At most three DB records per order in 24 hours')
  const abandoned = await gate('recovery', 'returns-reserve')
  assert.equal((await gate('recovery', 'returns-reserve')).status, 'busy')
  now += 60_001
  assert.equal((await gate('recovery', 'returns-reserve')).id, abandoned.id, 'Ambiguous retry reuses the MongoDB insert identity')
  const limits = await Promise.all(Array.from({ length: 12 }, () => gate('returns-ip', 'limit', { limit: 3, windowMs: 3600000 })))
  assert.equal(limits.filter(row => row.success).length, 3, 'Exact hourly IP budget is serialized')
  now += 3600001
  assert.equal((await gate('returns-ip', 'limit', { limit: 3, windowMs: 3600000 })).success, true)
  assert.ok(queryCount > 0)
  console.log('PASS: returns validation, generic ownership denial, signed-in ownership, pending duplicates, parallel inserts, exact hourly limits, daily quotas and recoverable idempotent claims')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
