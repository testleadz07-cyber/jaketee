import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
const modules = new Map()
function resolve(from, name) {
  const base = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(from), name) : null
  return base && [base + '.tsx', base + '.ts', path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(file => fs.existsSync(file))
}
function inspect(file) {
  if (modules.has(file)) return modules.get(file)
  const source = fs.readFileSync(file, 'utf8')
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  const info = { imports: [], endpoints: new Set(), cacheKeys: new Set(), database: false }
  modules.set(file, info)
  function visit(node) {
    if ((ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) || ts.isExportDeclaration(node)) {
      const name = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : ''
      const target = resolve(file, name)
      if (target) info.imports.push(target)
    }
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const target = resolve(file, node.arguments[0].text)
        if (target) info.imports.push(target)
      }
      const name = node.expression.getText(ast)
      if (name === 'connectDB') info.database = true
      if (name === 'publicRead' && node.arguments[0]) info.cacheKeys.add(node.arguments[0].getText(ast))
      if (['fetch', 'readPublicJson', 'readPublicResponse', 'navigator.sendBeacon'].includes(name) && node.arguments[0]) {
        const url = node.arguments[0].getText(ast).replace(/^[`'"]|[`'"]$/g, '')
        if (url.startsWith('/api/')) {
          const options = node.arguments[1]?.getText(ast) || ''
          const method = name === 'navigator.sendBeacon' ? 'POST' : options.match(/method:\s*['"]([^'"]+)/)?.[1] || 'GET'
          info.endpoints.add(`${method} ${url}`)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return info
}
function reachable(file, seen = new Set()) {
  if (seen.has(file)) return seen
  seen.add(file)
  for (const dependency of inspect(file).imports) reachable(dependency, seen)
  return seen
}
const pages = walk(path.resolve('src/app')).filter(file => /[/\\]page\.tsx$/.test(file)).sort()
const rows = pages.map(file => {
  const route = '/' + path.relative(path.resolve('src/app'), path.dirname(file)).replaceAll('\\', '/')
  const graph = [...reachable(file)].map(inspect)
  const endpoints = [...new Set(graph.flatMap(info => [...info.endpoints]))].sort()
  const cacheKeys = [...new Set(graph.flatMap(info => [...info.cacheKeys]))].sort()
  const privatePage = /^\/(admin|profile|checkout|cart|login|register|forgot-password|reset-password|order-confirmation|track-order)(\/|$)/.test(route)
  return { route, file: path.relative(root, file).replaceAll('\\', '/'), endpoints, cacheKeys,
    policy: privatePage ? 'Private reads: no shared response cache; GET timeout; mutations unchanged' : cacheKeys.length ? 'SSR public data: Cache API + shared tag versions; browser public-read deduplication' : 'Static content / conditional public API reads; no private response caching' }
})
const escape = value => value.replaceAll('|', '\\|').replaceAll('\n', ' ')
const lines = [
  '# Cloudflare page and API data audit', '',
  `Generated from ${pages.length} page entry points. Run \`npm run audit:page-data\` to regenerate.`, '',
  'This is a static import/call inventory: conditional, event-driven and imported calls are included; it is not a claim that every listed endpoint runs on initial page load.', '',
  'Shared layout calls: NextAuth session (private, five-minute polling plus window-focus refresh), authenticated cart sync, visible-tab session heartbeat/end, consent-based activity, chat visibility on public pages only, and admin push registration when authenticated. These remain outside shared caches. Every protected server request still validates current account/session state.', '',
  'Public pages keep their server-provided initial catalog data. Filter/search requests use bounded shared public reads, omit cookies, preserve pagination headers, and reject private/admin/draft URLs. Private pages use fresh GETs with a 20-second timeout; writes and payments are never retried by the read helper.', '',
  'Public database cache hits do not open MongoDB. Cache entries contain serialized public data only (BSON-safe), expire after 30–3600 seconds by data class, and use globally checked SQLite tag versions after mutations. Storage is local to each Cloudflare location and may be evicted; a miss reads current data. Immutable SSG assets use the official OpenNext static-assets cache. No R2 subscription or full HTML/auth-response caching is enabled.', '',
  '| Page | Policy | Reachable API calls | Public cache groups |', '| --- | --- | --- | --- |',
  ...rows.map(row => `| \`${escape(row.route)}\` | ${row.policy} | ${row.endpoints.map(url => '\`' + escape(url) + '\`').join('<br>') || 'No page-specific browser API call'} | ${row.cacheKeys.map(escape).join(', ') || '—'} |`), '',
  'Remaining deployment gates: runtime credentials stay operator-managed; Stripe webhook configuration and CPU-plan decisions remain excluded. Main-domain traffic remains on Vercel. No cron triggers or scheduled handler are configured. Real payment, Google OAuth, production upload and invoice acceptance require their respective integration tests.', '',
]
fs.mkdirSync('docs', { recursive: true })
fs.writeFileSync('docs/cloudflare-page-api-audit.md', lines.join('\n'))
console.log(JSON.stringify({ pages: pages.length, inspectedModules: modules.size, report: 'docs/cloudflare-page-api-audit.md' }))
export { rows }
