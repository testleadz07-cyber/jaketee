/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const { execFileSync } = require('node:child_process')
const React = require('react')
const { renderToString } = require('react-dom/server')

const cache = new Map()
const empty = () => null
const mocks = {
  'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  '@/components/header': { Header: empty },
  '@/components/footer': { Footer: empty },
  '@/components/breadcrumbs': { Breadcrumbs: empty },
  '@/components/whatsapp-help': { WhatsAppButton: empty },
  '@/components/collection-design-image': { CollectionDesignImage: ({ urls, alt }) => React.createElement('img', { src: urls[0], alt }) },
}
function evaluate(source, file, extra = {}) {
  const exports = {}
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText
  vm.runInNewContext(code, { exports, require(id) {
    if (id in mocks) return mocks[id]
    if (!id.startsWith('@/')) return require(id)
    const path = `src/${id.slice(2)}`
    return load(`${path}${fs.existsSync(`${path}.tsx`) ? '.tsx' : '.ts'}`)
  }, ...extra }, { filename: file })
  return exports
}
function load(file) {
  if (!cache.has(file)) cache.set(file, evaluate(fs.readFileSync(file, 'utf8'), file))
  return cache.get(file)
}

const data = load('src/data/materials-colors.ts')
const previous = execFileSync('git', ['-c', 'safe.directory=D:/luxestore/luxestore-late', 'show', 'HEAD:src/app/materials-colors/page.tsx'], { encoding: 'utf8' })
const ast = ts.createSourceFile('previous.tsx', previous, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const names = ['legacyAssetBrand', 'legacyAltAssetBrand', 'assetFolder', 'cloudinaryAsset', 'commonSwatches', 'leatherExtraSwatches', 'swatchLookup', 'materials']
const source = ast.statements.filter(statement => (ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => names.includes(declaration.name.getText(ast)))) || (ts.isFunctionDeclaration(statement) && statement.name?.text === 'getSwatches')).map(statement => statement.getText(ast)).join('\n')
const original = evaluate(`${source}\nexport {materials,getSwatches}`, 'previous.ts')
assert.equal(data.materials.length, 11)
assert.equal(JSON.stringify(data.materials), JSON.stringify(original.materials), 'Preserve every material, texture, description and collection link')
for (const material of data.materials) {
  const swatches = data.getSwatches(material)
  assert.equal(JSON.stringify(swatches), JSON.stringify(original.getSwatches(material)))
  assert.equal(new Set(swatches.map(color => color.name)).size, swatches.length)
  for (const swatch of swatches) assert.match(swatch.hex, /^#[0-9a-f]{6}$/i)
}
assert.equal(data.getSwatches(data.materials.find(material => material.id === 'melton-wool')).length, 25)
assert.equal(data.getSwatches(data.materials.find(material => material.id === 'cowhide-leather')).length, 31)
const { MaterialsGuidePage } = load('src/components/materials-guide-page.tsx')
const render = () => renderToString(React.createElement(MaterialsGuidePage, { faqJsonLd: {} }))
const html = render()
assert.equal(html, render(), 'Initial interactive state must match server rendering')
assert.equal((html.match(/<h1[ >]/g) || []).length, 1)
assert.ok(!/<details[\s>]/.test(html))
for (const material of data.materials) {
  assert.ok(html.includes(`id="${material.id}"`), material.id)
  assert.ok(html.includes(`id="colors-${material.id}"`), material.id)
}
assert.equal((html.match(/aria-label="Melton Wool reference colors"/g) || []).length, 1)
assert.ok(html.includes('25 reference shades'))
const imageManifest = JSON.parse(fs.readFileSync('src/data/material-images.json', 'utf8'))
if (imageManifest.length) {
  const images = Object.fromEntries(imageManifest.map(image => [image.key, image]))
  const updated = renderToString(React.createElement(MaterialsGuidePage, { faqJsonLd: {}, images }))
  assert.ok(updated.includes(images.hero.url))
  for (const material of data.materials) {
    assert.ok(updated.includes(images[`${material.id}-main`].url), `${material.id} main image`)
    assert.ok(updated.includes(images[`${material.id}-detail`].url), `${material.id} texture image`)
    assert.ok(updated.includes(`aria-label="${material.name.replace(/&/g, '&amp;')} image views"`), `${material.id} view controls`)
  }
}
console.log('Materials guide checks passed: 11 material entries, complete swatch ranges, accurate counts, valid anchors and deterministic SSR.')
