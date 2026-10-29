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
  console.log('PASS: server admin guards distinguish anonymous/customer/admin and fail closed for invalidated sessions')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
