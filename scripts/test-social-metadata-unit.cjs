const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, dependencies = {}, source = fs.readFileSync(file, 'utf8')) {
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, process,
    require(name) {
      if (name in dependencies) return dependencies[name]
      throw new Error(`Unexpected dependency: ${name}`)
    },
  }, { filename: file })
  return exports
}

const seo = load('src/lib/seo-metadata.ts')
function checkCopy(metadata) {
  assert.equal(metadata.openGraph.title, metadata.title)
  assert.equal(metadata.openGraph.description, metadata.description)
  assert.equal(metadata.twitter.title, metadata.title)
  assert.equal(metadata.twitter.description, metadata.description)
  assert.equal(metadata.twitter.card, 'summary_large_image')
  assert.ok(metadata.openGraph.images[0].url)
  assert.equal(metadata.twitter.images[0].url, metadata.openGraph.images[0].url)
}

// Reproduce the inherited/stale share copy, and ensure subsequent SEO edits flow through.
for (const title of ['School Letterman Jackets | Jacketee', 'Updated school jacket title']) {
  const result = seo.withSocialMetadata({
    title, description: 'Page-specific ordering information.',
    openGraph: { title: 'Old title', description: 'Old description', type: 'article' },
    twitter: { title: 'Custom Varsity & Bomber Jackets', description: 'Old description' },
  })
  checkCopy(result)
  assert.equal(result.openGraph.type, 'article')
  assert.equal(result.openGraph.images[0].url, '/opengraph-image')
}

for (const image of ['/hero.jpg', { url: '/featured.jpg', alt: 'Featured jacket' }, new URL('https://example.com/jacket.jpg')]) {
  const result = seo.withSocialMetadata({ title: 'Page', description: 'Description', openGraph: { images: [image] } })
  checkCopy(result)
  assert.equal(String(result.openGraph.images[0].url), String(image.url || image))
  assert.equal(result.openGraph.images[0].width, 1200)
  assert.equal(result.openGraph.images[0].height, 630)
}
assert.equal(seo.withSocialMetadata({ title: 'Empty images', openGraph: { images: [] } }).openGraph.images[0].url, '/opengraph-image')
assert.ok(seo.socialImageUrl().endsWith('/opengraph-image'))

// Exercise the actual FAQ configuration that previously had mismatched share text.
const faq = load('src/app/faq/metadata.ts', { '@/lib/seo-metadata': seo }).metadata
checkCopy(faq)
assert.match(faq.openGraph.title, /Frequently Asked Questions/)

// Evaluate the patches page's real metadata declaration without rendering its UI.
const patchSource = fs.readFileSync('src/app/patches-embroidery/page.tsx', 'utf8')
const patchAst = ts.createSourceFile('page.tsx', patchSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const patchDeclaration = patchAst.statements.find(node => ts.isVariableStatement(node)
  && node.declarationList.declarations.some(declaration => declaration.name.getText(patchAst) === 'defaultMetadata'))
assert.ok(patchDeclaration)
const patchMetadata = load('patch-metadata.ts', { '@/lib/seo-metadata': seo },
  `import { withSocialMetadata } from '@/lib/seo-metadata'; const heroImage = '/patch-hero.jpg'; const PAGE_URL = 'https://www.jacketee.com/patches-embroidery'; export ${patchDeclaration.getText(patchAst)}`,
).defaultMetadata
checkCopy(patchMetadata)
assert.equal(patchMetadata.openGraph.title, 'Chenille Patches for Letterman Jackets | Jacketee')
assert.equal(patchMetadata.openGraph.images[0].url, '/patch-hero.jpg')

// Metadata-only layouts must continue to inherit parent page copy.
const robots = { robots: { index: false } }
assert.equal(seo.withSocialMetadata(robots), robots)
console.log('Social metadata regression checks passed.')
