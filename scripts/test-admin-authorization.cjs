const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

async function main() {
  let session = null
  const module = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync('src/lib/require-admin.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const mocks = {
    'server-only': {}, 'next-auth': { getServerSession: async () => session },
    'next/server': { NextResponse: Response }, '@/lib/auth-options': { authOptions: {} },
    'next/navigation': { redirect: url => { throw new Error('REDIRECT ' + url) } },
  }
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})', { Response })(id => {
    if (!(id in mocks)) throw Error('Unexpected import ' + id)
    return mocks[id]
  }, module, module.exports)
  const { requireAdminApi, requireAdminPage } = module.exports
  assert.equal((await requireAdminApi()).response.status, 401)
  await assert.rejects(requireAdminPage(), /REDIRECT \/login\?callbackUrl=\/admin\/dashboard/)
  session = { user: { id: 'customer', role: 'customer' } }
  assert.equal((await requireAdminApi()).response.status, 403)
  await assert.rejects(requireAdminPage(), /REDIRECT/)
  session = { user: { id: 'admin', role: 'admin' } }
  assert.equal((await requireAdminApi()).user.id, 'admin')
  assert.equal((await requireAdminPage()).id, 'admin')
  session = null // Existing session callback returns null for revoked/disabled accounts.
  assert.equal((await requireAdminApi()).response.status, 401)
  // Exercise the REAL session callback and current-account lookup, rather than
  // only pretending that invalidation has already happened.
  function load(file, dependencies) {
    const mod = { exports: {} }
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
    vm.runInNewContext('(function(require,module,exports){' + code + '\n})', { console, process: { env: {} } })(id => {
      if (id in dependencies) return dependencies[id]
      return {}
    }, mod, mod.exports)
    return mod.exports
  }
  let account = { _id: '123456789012345678901234', role: 'admin', isActive: true }, revoked = false
  const query = value => ({ select() { return this }, lean: async () => value })
  const currentUser = load('src/lib/session-user.ts', {
    '@/lib/mongodb': { connectDB: async () => true },
    '@/models/User': { __esModule: true, default: { findOne: () => query(account.isActive ? account : null) } },
    '@/models/LoginSession': { __esModule: true, default: { findOne: () => query(revoked ? null : { _id: 'login' }) } },
  })
  const { authOptions } = load('src/lib/auth-options.ts', {
    'next-auth/providers/credentials': { __esModule: true, default: config => config },
    '@/lib/session-user': currentUser,
  })
  const refresh = () => authOptions.callbacks.session({ session: { user: {} }, token: { userId: account._id, loginSessionId: '234567890123456789012345' } })
  session = await refresh()
  assert.equal((await requireAdminApi()).user.role, 'admin')
  account.role = 'customer'
  session = await refresh()
  assert.equal((await requireAdminApi()).response.status, 403, 'Demotion is read from DB, not stale JWT')
  account.role = 'admin'; account.isActive = false
  session = await refresh()
  assert.equal((await requireAdminApi()).response.status, 401)
  account.isActive = true; revoked = true
  session = await refresh()
  assert.equal((await requireAdminApi()).response.status, 401)
  console.log('PASS: server admin guards distinguish anonymous/customer/admin and fail closed for invalidated sessions')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
