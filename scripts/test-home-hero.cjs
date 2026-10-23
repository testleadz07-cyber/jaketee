/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToString } = require('react-dom/server')
const saved = JSON.parse(fs.readFileSync('src/data/home-hero-images.json', 'utf8'))
assert.equal(saved.length, 2)
const images = Object.fromEntries(saved.map(image => [image.key, image]))
assert.ok(images.desktop.width > images.desktop.height)
assert.ok(images.mobile.height > images.mobile.width)
for (const image of saved) {
  assert.match(image.url, /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//)
  assert.ok(image.publicId.startsWith('jacketee/home/hero/'))
  assert.ok(image.alt.length > 30)
}
function load(file, mocks = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, process: { env: {} }, console: { error() {} }, require(id) { return id in mocks ? mocks[id] : require(id) },
  }, { filename: file })
  return exports
}
async function dataScenario(database, rows = [], fail = false) {
  return load('src/lib/home-hero-images.ts', {
    react: { cache: fn => fn },
    '@/data/home-hero-images.json': saved,
    '@/lib/mongodb': { connectDB: async () => database },
    '@/models/SectionImage': { __esModule: true, default: { find: query => {
      assert.equal(query.section, 'home-hero')
      return { select: () => ({ lean: async () => { if (fail) throw Error('Database unavailable'); return rows } }) }
    } } },
  }).getHomeHeroImages()
}
;(async () => {
  for (const options of [[false], [true, [], true]]) {
    const result = await dataScenario(...options)
    assert.equal(result.desktop.url, images.desktop.url)
    assert.equal(result.mobile.url, images.mobile.url)
  }
  const updated = await dataScenario(true, [{ key: 'desktop', url: 'https://res.cloudinary.com/test/image/upload/new-desktop.webp', alt: 'Updated desktop' }, { key: 'mobile', url: 'javascript:alert(1)' }])
  assert.equal(updated.desktop.url, 'https://res.cloudinary.com/test/image/upload/new-desktop.webp')
  assert.equal(updated.mobile.url, images.mobile.url)
  const retired = await dataScenario(true, [{ key: 'desktop', url: 'https://res.cloudinary.com/test/image/upload/clothaa/exports/patches-embroidery/retired-hero.jpg', alt: 'Retired asset' }])
  assert.equal(retired.desktop.url, images.desktop.url, 'Retired exports must never replace the new hero')
  const loader = load('src/lib/image-loader.ts')
  const { HomeHero } = load('src/components/home-hero.tsx', {
    '@/lib/home-hero-images': { getHomeHeroImages: async () => images, homeHeroImage: images.desktop.url },
    '@/lib/image-loader': loader,
    '@/components/ui/button': { Button: ({ children }) => children },
    'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  })
  const html = renderToString(await HomeHero())
  assert.equal(html, renderToString(await HomeHero()))
  const source = html.match(/<source[^>]+>/)?.[0]
  assert.ok(source?.includes(images.mobile.publicId))
  assert.ok(source.includes('1080w'))
  assert.ok(html.match(/<img[^>]+>/)?.[0].includes(images.desktop.publicId))
  const links = html.match(/<link[^>]+>/g) || []
  assert.ok(links.some(link => link.includes('max-width: 767px') && link.includes(images.mobile.publicId)))
  assert.ok(links.some(link => link.includes('min-width: 768px') && link.includes(images.desktop.publicId)))
  assert.ok(html.includes('href="/design/varsity"') && html.includes('href="/shop"'))
  const about = load('src/app/about/page.tsx', {
    '@/lib/home-hero-images': { getHomeHeroImages: async () => images, homeHeroImage: images.desktop.url, homeHeroAlt: images.desktop.alt },
    '@/lib/image-loader': loader,
    '@/lib/seo-metadata': { withSocialMetadata: data => data },
    '@/components/header': { Header: () => null },
    '@/components/footer': { Footer: () => null },
    '@/components/breadcrumbs': { Breadcrumbs: () => null },
    'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  })
  const aboutHtml = renderToString(await about.default())
  assert.ok(aboutHtml.match(/<source[^>]+>/)?.[0].includes(images.mobile.publicId))
  assert.ok(aboutHtml.match(/<img[^>]+>/)?.[0].includes(images.desktop.publicId))
  assert.equal(about.metadata.openGraph.images[0].url, images.desktop.url)
  console.log('Homepage hero checks passed: desktop/mobile assets, matched preloads, stable SSR, valid CTAs and database-outage fallback.')
})().catch(error => { console.error(error); process.exitCode = 1 })
