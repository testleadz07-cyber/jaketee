/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const mongoose = require('mongoose')
const { webcrypto } = require('node:crypto')

function loader(globals, mocks) {
  const modules = new Map()
  const context = vm.createContext({ console, process: { env: { NODE_ENV: 'production' } }, crypto: webcrypto,
    Request, Response, Headers, URL, TextEncoder, Uint8Array, AbortSignal, AbortController, DOMException,
    setTimeout, clearTimeout, ...globals })
  const load = file => {
    file = path.resolve(file)
    if (modules.has(file)) return modules.get(file).exports
    const mod = { exports: {} }; modules.set(file, mod)
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText
    vm.runInContext('(function(require,module,exports){' + source + '\n})', context)(id => {
      if (id in mocks) return mocks[id]
      if (id === 'node:async_hooks') return require(id)
      if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id + '.ts'))
      throw new Error('Unexpected import: ' + id)
    }, mod, mod.exports)
    return mod.exports
  }
  return { load, context }
}

async function main() {
  let databaseConnections = 0, loads = 0, versionStoreFailed = false
  const stored = new Map(), cache = new Map()
  let serial = Promise.resolve()
  const storage = {
    get: async keys => Array.isArray(keys) ? new Map(keys.filter(key => stored.has(key)).map(key => [key, stored.get(key)])) : stored.get(keys),
    put: async (key, value) => stored.set(key, value),
    transaction(fn) { const result = serial.then(() => fn(storage)); serial = result.catch(() => {}); return result },
  }
  let tagObject
  const env = { PUBLIC_CACHE_TAGS: { idFromName: value => value, get: () => ({
    fetch: (url, init) => versionStoreFailed ? Promise.resolve(new Response(null, { status: 503 })) : tagObject.fetch(new Request(url, init)),
  }) } }
  const system = loader({ caches: { default: {
    match: async request => cache.get(request.url)?.clone(),
    put: async (request, response) => { cache.set(request.url, response.clone()) },
  } } }, {
    'server-only': {}, mongoose,
    'next/server': { connection: async () => {} },
    'next/cache': { unstable_cache: fn => fn },
    './mongodb': { connectDB: async () => { databaseConnections++; return true } },
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env }) },
  })
  tagObject = new (system.load('src/cloudflare/public-cache-tags.ts').PublicCacheTags)({ storage })
  const scope = system.load('src/lib/worker-request-scope.ts')
  const { publicRead } = system.load('src/lib/public-cache.ts')
  const { invalidateCloudflarePublicTags } = system.load('src/lib/cloudflare-public-cache.ts')
  const run = fn => scope.runInWorkerRequest({ values: new Map([['request-url', 'https://example.invalid/shop']]), cleanup: [] }, fn)
  const id = new mongoose.Types.ObjectId(), createdAt = new Date('2026-10-29T00:00:00Z')
  const read = (key = 'catalog') => publicRead(key, { page: 1 }, 60, ['public-products'], async () => {
    loads++; return { id, createdAt, value: loads }
  })
  const [first, concurrent] = await run(() => Promise.all([read(), read()]))
  assert.equal(loads, 1, 'Concurrent reads within one invocation share the DB loader')
  assert.equal(first.id.toHexString(), id.toHexString())
  assert.equal(first.createdAt.toISOString(), createdAt.toISOString())
  assert.equal(concurrent.value, 1)
  assert.equal((await run(() => read())).value, 1)
  assert.equal(databaseConnections, 1, 'A cache hit in a different request must not open MongoDB')
  await run(() => invalidateCloudflarePublicTags(['public-products']))
  assert.equal((await run(() => read())).value, 2, 'Invalidation stops old entries in every location via a changed key')
  versionStoreFailed = true
  assert.equal((await run(() => read())).value, 3, 'Do not serve cached data without a valid tag-version check')
  versionStoreFailed = false
  await assert.rejects(run(() => publicRead('failure', [], 60, ['public-products'], async () => { throw Error('offline') })), /offline/)
  assert.equal(cache.size, 2, 'Failures must not be cached')
  console.log('PASS: public cache avoids DB on hits, preserves BSON, deduplicates in-request reads and invalidates across requests')

  let fetches = 0, release
  const client = loader({ fetch: async (_url, init) => {
    fetches++; assert.equal(init.credentials, 'omit')
    return new Promise(resolve => { release = () => resolve(Response.json([{ id: 'public' }], { headers: { 'X-Total-Count': '17' } })) })
  } }, {})
  const { readPublicResponse } = client.load('src/lib/public-json.ts')
  const abort = new AbortController()
  const canceled = readPublicResponse('/api/categories', { signal: abort.signal })
  const other = readPublicResponse('/api/categories')
  abort.abort()
  await assert.rejects(canceled, error => error.name === 'AbortError')
  release()
  const response = await other
  assert.equal(response.headers.get('X-Total-Count'), '17')
  assert.equal((await response.json())[0].id, 'public')
  assert.equal((await (await readPublicResponse('/api/categories')).json())[0].id, 'public')
  assert.equal(fetches, 1, 'One component aborting must not cancel another component or cause a second fetch')
  for (const url of ['/api/admin/users', '/api/users/profile', '/api/products?all=true', 'https://evil.invalid/api/products']) {
    await assert.rejects(readPublicResponse(url), /Only public/)
  }
  let rawFetchInit
  const api = loader({ fetch: async (_url, init) => { rawFetchInit = init; return new Response() } }, {}).load('src/lib/api-fetch.ts')
  await api.apiFetch('/api/users/profile')
  assert.ok(rawFetchInit.signal)
  assert.equal(rawFetchInit.cache, 'no-store')
  const mutation = { method: 'POST', body: '{}' }
  await api.apiFetch('/api/orders', mutation)
  assert.equal(rawFetchInit, mutation, 'Read optimization must not retry or alter mutations')
  console.log('PASS: public browser reads omit cookies, share calls safely, preserve pagination and reject private/draft endpoints; private GETs time out')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
