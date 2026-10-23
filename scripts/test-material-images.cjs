/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const saved = JSON.parse(fs.readFileSync('src/data/material-images.json', 'utf8'))
const ids = ['melton-wool', 'cowhide-leather', 'sheep-leather', 'faux-leather', 'polyester-satin', 'cotton-fleece', 'cotton-twill', 'soft-shell', 'nylon-twill', 'suede-leather', 'snaps-zips']
const keys = ['hero', ...ids.flatMap(id => [`${id}-main`, `${id}-detail`])]
assert.equal(saved.length, 23)
assert.equal(new Set(saved.map(image => image.key)).size, 23)
for (const key of keys) {
  const image = saved.find(item => item.key === key)
  assert.ok(image, key)
  assert.match(image.url, /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//)
  assert.ok(image.publicId.startsWith('jacketee/materials-colors/'))
  assert.ok(image.alt.length > 20)
  assert.ok(image.width > 1000 && image.height > 700)
}
async function scenario({ database = false, fail = false, rows = [] } = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/material-section-images.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports, console: { error() {} }, require(id) {
      if (id === 'react') return { cache: fn => fn }
      if (id === '@/lib/mongodb') return { connectDB: async () => database }
      if (id === '@/models/SectionImage') return { __esModule: true, default: { find: query => {
        assert.equal(query.section, 'materials-colors')
        return { select: () => ({ lean: async () => { if (fail) throw Error('Database unavailable'); return rows } }) }
      } } }
      if (id === '@/data/material-images.json') return saved
      throw Error(id)
    },
  })
  return exports.getMaterialSectionImages()
}
;(async () => {
  for (const options of [{}, { database: true, fail: true }]) {
    const images = await scenario(options)
    assert.equal(Object.keys(images).length, 23)
    assert.equal(images.hero.url, saved.find(image => image.key === 'hero').url)
  }
  const images = await scenario({ database: true, rows: [{ key: 'hero', url: 'https://res.cloudinary.com/test/image/upload/new-hero.webp', alt: 'Updated hero' }, { key: 'cowhide-leather-main', url: 'javascript:alert(1)', alt: 'Invalid' }] })
  assert.equal(images.hero.url, 'https://res.cloudinary.com/test/image/upload/new-hero.webp')
  assert.equal(images['cowhide-leather-main'].url, saved.find(image => image.key === 'cowhide-leather-main').url)
  assert.equal(Object.keys(images).length, 23)
  console.log('Material images passed: 23 complete Cloudinary assets, database overrides, rejected invalid URLs and database-outage fallback.')
})().catch(error => { console.error(error); process.exitCode = 1 })
