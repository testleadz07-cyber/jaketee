const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const source = ts.transpileModule(fs.readFileSync('src/app/sitemap.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
const products = [
  { _id: 'old', slug: 'baby-pink-wool-and-black-leather-sleeves-varsity-hoodie', categoryId: 'hooded' },
  { _id: 'retained', slug: 'baby-pink-letterman-jacket-with-hood', categoryId: 'hooded' },
]
const categories = [{ _id: 'varsity', slug: 'varsity-jackets' }, { _id: 'hooded', slug: 'hooded', parentId: 'varsity' }]
const query = value => ({ select() { return this }, sort() { return this }, lean: async () => value })
const mocks = {
  '@/lib/mongodb': { connectDB: async () => true },
  '@/lib/public-cache': { publicRead: async (_key, _args, _seconds, _tags, load) => load() },
  '@/models/Product': { find: () => query(products) },
  '@/models/Category': { find: () => query(categories) },
  '@/models/BlogPost': { find: () => query([]) },
  '@/models/BlogCategory': { find: () => query([]) },
  '@/models/Faq': { findOne: () => query(null) },
  '@/lib/categories': {
    resolveAncestorChain: (_categories, id) => id === 'hooded' ? categories : [categories[0]],
    buildCategoryUrl: chain => '/' + chain.map(c => c.slug).join('/'),
    buildProductUrl: ({ slug, categoryPath }) => '/' + [...categoryPath.map(c => c.slug), slug].join('/'),
  },
}
const moduleValue = { exports: {} }
const localRequire = name => {
  if (mocks[name]) return mocks[name]
  if (name.startsWith('@/data/')) return JSON.parse(fs.readFileSync('src/data/' + name.slice('@/data/'.length), 'utf8'))
  return require(name)
}
vm.runInNewContext(`(function(require,module,exports){${source}\n})`, { URL, console })(localRequire, moduleValue, moduleValue.exports)
moduleValue.exports.default().then(routes => {
  const urls = routes.map(route => route.url)
  assert.equal(urls.filter(url => url.endsWith('/baby-pink-letterman-jacket-with-hood')).length, 1)
  assert.ok(!urls.some(url => url.includes('baby-pink-wool-and-black')))
  assert.ok(urls.includes('https://www.jacketee.com/'))
  assert.equal(urls.length, new Set(urls).size)
  console.log('Bing sitemap checks passed: redirect destination, canonical deduplication, and root URL.')
}).catch(error => { console.error(error); process.exitCode = 1 })
