// Exercise every exported admin HTTP method without real DB/provider access.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])

async function main() {
  let tested = 0
  const adminFiles = walk('src/app/api/admin').filter(file => file.endsWith('route.ts'))
  const outsideMethods = new Map(Object.entries({
    'src/app/api/products/route.ts': ['POST'], 'src/app/api/products/[id]/route.ts': ['PUT', 'DELETE'],
    'src/app/api/products/bulk-delete/route.ts': ['POST'], 'src/app/api/categories/route.ts': ['POST'],
    'src/app/api/categories/[id]/route.ts': ['PUT', 'DELETE'], 'src/app/api/orders/[id]/route.ts': ['PATCH'],
  }))
  const files = [...adminFiles, ...outsideMethods.keys()]
  for (const file of files) {
    let role = null, guardCalls = 0, unexpectedCalls = 0
    const user = () => role ? { id: '123456789012345678901234', role } : undefined
    const session = () => user() ? { user: user() } : null
    const denied = () => Response.json({ error: 'Denied' }, { status: role ? 403 : 401 })
    const unused = new Proxy(function () { unexpectedCalls++; throw Error('Provider/DB call forbidden in access test') }, {
      get: (_target, property) => property === '__esModule' ? true : property === 'then' ? undefined : unused,
    })
    const mocks = {
      '@/lib/require-admin': { requireAdminApi: async () => { guardCalls++; return role === 'admin' ? { user: user() } : { response: denied() } } },
      '@/lib/guest-activity-admin': { requireGuestActivityAdmin: async () => { guardCalls++; return role === 'admin' ? null : denied() } },
      'next-auth': { getServerSession: async () => { guardCalls++; return session() } },
      'next-auth/jwt': { getToken: async () => { guardCalls++; return null } },
      'next/server': { NextResponse: Response }, '@/lib/auth-options': { authOptions: {} },
      '@/lib/mongodb': { connectDB: async () => { unexpectedCalls++; return null } },
    }
    const module = { exports: {} }
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
    vm.runInNewContext('(function(require,module,exports){' + source + '\n})', { Response, Request, URL, console: { error() {} }, process: { env: {} }, setTimeout, clearTimeout, Buffer })(id => mocks[id] || unused, module, module.exports)
    for (const [method, handler] of Object.entries(module.exports).filter(([name, value]) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(name) && typeof value === 'function')) {
      if (outsideMethods.has(file) && !outsideMethods.get(file).includes(method)) continue
      for (const identity of [null, 'customer']) {
        role = identity; guardCalls = 0; unexpectedCalls = 0
        const request = new Request('https://example.invalid/api/admin/test', {
          method, headers: { origin: 'https://example.invalid', 'content-type': 'application/json' },
          ...(!['GET', 'HEAD'].includes(method) ? { body: '{}' } : {}),
        })
        request.nextUrl = new URL(request.url)
        const response = await handler(request, { params: Promise.resolve({ id: '123456789012345678901234' }) })
        const push = file.includes(path.sep + 'push' + path.sep)
        const retainedGuard = push || file.includes(path.sep + 'home-cache' + path.sep)
        assert.equal(response.status, identity && !retainedGuard ? 403 : 401, file + ' ' + method + ' role=' + identity)
        assert.ok(guardCalls > 0, file + ' must invoke server authorization')
        assert.equal(unexpectedCalls, 0, 'Denied request must not reach DB/provider: ' + file)
        assert.match(response.headers.get('content-type'), /json/)
        tested++
      }
    }
  }
  assert.equal(adminFiles.length, 24)
  assert.equal(tested, 120)
  console.log(`PASS: ${tested} anonymous/customer denials across all 52 admin methods and 8 catalog/order writes; no DB/provider calls before authorization`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
