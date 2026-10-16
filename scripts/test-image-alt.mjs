import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { productImageAlt, cleanProductName } from '../src/lib/image-alt.mjs'
const source = ts.transpileModule(readFileSync('src/lib/image-loader.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { default: loader } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const base = 'https://res.cloudinary.com/demo/image/upload/'
for (const path of ['v123/jacket.png', 'f_auto,q_auto,w_1440/v123/jacket.png', 'w_500/jacket.png', 'f_auto/w_500/v123/jacket.png']) {
  const result = loader({ src: base + path, width: 640 })
  assert.equal(result, base + 'f_auto,q_auto,c_limit,w_640/' + (path.includes('v123/') ? 'v123/jacket.png' : 'jacket.png'))
}
assert.equal(loader({ src: '/photo.png', width: 640 }), '/_next/image?url=%2Fphoto.png&w=640&q=75')
for (const [index, view] of ['front view', 'back view', 'right sleeve view', 'left sleeve view'].entries()) {
  assert.equal(productImageAlt('Jacket', 'random.png', index), `Jacket, ${view}`)
}
assert.equal(productImageAlt('Jacket', 'left-sleeve.png', 0), 'Jacket, left sleeve view')
assert.equal(productImageAlt('Jacket', '%broken.png', 0), 'Jacket, front view')
assert.equal(cleanProductName('Jacket For Mens And Women'), 'Jacket Men\u2019s and Women\u2019s')
assert.equal(productImageAlt('Jacket', 'jacket-detail-1.jpg', 3), 'Jacket, detail view 1')
assert.equal(productImageAlt('Jacket', 'jacket-detail-3.jpg', 5), 'Jacket, detail view 3')
assert.equal(productImageAlt('Jacket', 'jacket-side.jpg', 2), 'Jacket, side view')
assert.equal(productImageAlt('Jacket', 'random.jpg', 4), 'Jacket, detail view')
const patches = JSON.parse(readFileSync('src/data/patch-images.json', 'utf8'))
for (const image of patches) {
  assert.ok(image.alt.length < 100, image.key)
  assert.doesNotMatch(image.alt, /directly|no felt backing|original emblem/i)
}
console.log(`Passed gallery, audience, loader and ${patches.length} patch-description checks.`)
