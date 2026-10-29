const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
let admin = true
let registered = []
let usage = []
let updates = []
const Tag = {
  find: () => ({ lean: async () => registered.map(name => ({ name })) }),
  findOne: async ({ name }) => registered.includes(name),
  exists: async ({ name }) => registered.includes(name),
  create: async ({ name }) => registered.push(name),
  updateOne: async ({ name }) => { if (!registered.includes(name)) registered.push(name) },
  deleteOne: async ({ name }) => { registered = registered.filter(tag => tag !== name) },
}
const Product = {
  aggregate: async pipeline => { assert.ok(pipeline[0].$project.tags.$setUnion); return usage },
  findOne: async ({ tags }) => usage.some(item => item._id === tags),
  exists: async ({ tags }) => usage.some(item => item._id === tags),
  updateMany: async (...args) => { updates.push(args) },
}
const mocks = {
  '@/lib/require-admin': { requireAdminApi: async () => admin ? { user: { role: 'admin' } } : { response: { body: { error: 'Unauthorized' }, status: 401 } } },
  'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
  'next-auth': { getServerSession: async () => admin ? { user: { role: 'admin' } } : null },
  '@/lib/auth-options': { authOptions: {} },
  '@/lib/home-cache': { invalidateHomeCache: async () => {} },
  '@/lib/mongodb': { connectDB: async () => true },
  '@/models/Product': { default: Product, __esModule: true },
  '@/models/Tag': { default: Tag, __esModule: true },
  mongoose: { default: { connection: { readyState: 1 } }, __esModule: true },
}
const exportsObject = {}
const code = ts.transpileModule(fs.readFileSync('src/app/api/admin/tags/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
vm.runInNewContext(code, { exports: exportsObject, require: name => { assert.ok(mocks[name], name); return mocks[name] }, console, URL })
const request = body => ({ url: 'https://example.invalid/api/admin/tags', json: async () => body })
;(async () => {
  admin = false
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) assert.equal((await exportsObject[method](request({}))).status, 401)
  admin = true
  assert.equal((await exportsObject.POST(request({ tag: '  Summer & Sale  ' }))).status, 200)
  assert.deepEqual(JSON.parse(JSON.stringify((await exportsObject.GET(request({}))).body)), { tags: ['Summer & Sale'], usage: [{ name: 'Summer & Sale', productCount: 0 }] })
  assert.equal((await exportsObject.POST(request({ tag: 'Summer & Sale' }))).status, 409)
  assert.equal((await exportsObject.POST(request({ tag: '  ' }))).status, 400)
  usage = [{ _id: 'Legacy', count: 12 }]
  const list = (await exportsObject.GET(request({}))).body
  assert.equal(list.usage.find(item => item.name === 'Legacy').productCount, 12)
  assert.equal((await exportsObject.PUT(request({ oldTag: 'Legacy', newTag: 'Summer & Sale' }))).status, 409)
  assert.equal((await exportsObject.PUT(request({ oldTag: 'Legacy', newTag: '$New' }))).status, 200)
  assert.ok(Array.isArray(updates[0][1]))
  assert.equal(updates[0][1][0].$set.tags.$setUnion[1].$literal[0], '$New')
  assert.equal((await exportsObject.PUT(request({ oldTag: 'Missing', newTag: 'Other' }))).status, 404)
  assert.equal((await exportsObject.DELETE(request({ tag: '$New' }))).status, 200)
  assert.ok(!registered.includes('$New'))
  console.log('Passed: admin authorization, unused-tag persistence, counts, legacy tags, validation, duplicate prevention, safe rename pipeline and deletion.')
})().catch(error => { console.error(error); process.exitCode = 1 })
