/* eslint-disable @typescript-eslint/no-require-imports */
// Offline only: unexpected imports fail closed; no database or email modules load.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, { exports, process: { env: {} }, console: { error() {} },
    require(id) {
      if (!(id in mocks)) throw Error('Unexpected import: ' + id)
      return mocks[id]
    },
  }, { filename: file })
  return exports
}

async function main() {
  let session = null, dbCalls = 0, seenFilter, seenLimit, seenSkip
  const query = {
    sort() { return this }, skip(value) { seenSkip = value; return this },
    limit(value) { seenLimit = value; return this }, populate() { return this },
    lean: async () => [],
  }
  const response = { NextResponse: { json: (data, options = {}) => ({ data, status: options.status || 200 }) } }
  const { GET } = load('src/app/api/products/route.ts', {
    '@/lib/require-admin': { requireAdminApi: async () => session?.user?.role === 'admin' ? { user: session.user } : { response: { data: { error: 'Unauthorized' }, status: 401 } } },
    'next/server': response, 'next-auth': { getServerSession: async () => session },
    '@/lib/auth-options': { authOptions: {} },
    '@/lib/mongodb': { connectDB: async () => { dbCalls++; return true } },
    '@/lib/public-catalog': { getPublicCategories: async () => [], getPublicCategoryCounts: async () => [] },
    '@/lib/home-cache': { invalidateHomeCache() {} },
    '@/lib/catalog-products': {
      getCatalogProducts: async ({ filter, limit, page }) => { seenFilter = filter; seenLimit = limit; seenSkip = (page - 1) * limit; return { products: [], total: 0 } },
      getSearchFacetProducts: async () => [],
    },
    '@/models/Product': { __esModule: true, default: { find: filter => { seenFilter = filter; return query }, countDocuments: async () => 0 } },
    '@/models/Category': { __esModule: true, default: { find: () => query } },
    '@/lib/categories': { resolveDescendantIds: () => [], resolveAncestorChain: () => [] },
    '@/lib/catalog-filters': { readCatalogFilters: () => ({}), catalogFilterQuery: () => ({}), getCatalogFacetData: () => ({}) },
    '@/lib/video-media': { validateVideoUrls: () => [] }, mongoose: { Types: {} },
  })
  const get = params => GET({ nextUrl: { searchParams: new URLSearchParams(params) } })
  assert.equal((await get('all=true')).status, 401)
  session = { user: { role: 'customer' } }
  assert.equal((await get('all=true&status=inactive')).status, 401)
  assert.equal(dbCalls, 0, 'Rejected requests must not reach the database')
  assert.equal((await get('status=inactive&stock=out&page=-2&limit=999999')).status, 200)
  assert.equal(seenFilter.status, 'active')
  assert.equal(seenFilter.inStock, true)
  assert.equal(seenFilter.isDraft.$ne, true)
  assert.equal(seenLimit, 100)
  assert.equal(seenSkip, 0)
  session = { user: { role: 'admin' } }
  assert.equal((await get('all=true&status=inactive&stock=out')).status, 200)
  assert.equal(seenFilter.status, 'inactive')
  assert.equal(seenFilter.inStock, false)
  assert.equal(seenFilter.isDraft, undefined)

  let dbAvailable = false, saved = [], emailCalls = 0, saveFails = false
  const { POST } = load('src/app/api/newsletter/subscribe/route.ts', {
    'next/server': response,
    '@/lib/mongodb': { connectDB: async () => dbAvailable },
    '@/models/Subscriber': { __esModule: true, default: {
      findOne: async () => null,
      create: async data => { if (saveFails) throw Error('Save failed'); saved.push(data) },
    } },
    '@/lib/notifications': { createNotification: async () => { throw Error('Notification failed') } },
    '@/lib/email': { newsletterSubscriptionTemplate: () => '', sendEmail: async () => { emailCalls++; throw Error('SMTP failed') } },
    '@/lib/turnstile': { requireTurnstile: async () => null },
  })
  const subscribe = () => POST({ json: async () => ({ email: ' Alex@example.com ' }) })
  assert.equal((await subscribe()).status, 503)
  assert.equal(saved.length, 0)
  assert.equal(emailCalls, 0)
  dbAvailable = true
  assert.equal((await subscribe()).status, 201)
  assert.equal(saved[0].email, 'alex@example.com')
  saveFails = true
  assert.equal((await subscribe()).status, 500)
  assert.equal(saved.length, 1)
  assert.equal(emailCalls, 1)
  console.log('Offline safety checks passed: product permissions, visibility, pagination, and durable newsletter acceptance. No real DB or email access.')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
