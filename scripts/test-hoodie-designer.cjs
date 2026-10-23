/* eslint-disable @typescript-eslint/no-require-imports -- Standalone SVG and server validation tests with mocked catalog lookups. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const sharp = require('sharp')
const cache = new Map()
function load(file) {
  file = path.resolve(file)
  if (cache.has(file)) return cache.get(file)
  const exports = {}; cache.set(file, exports)
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
  new Function('require', 'exports', compiled)(name => {
    if (name === '@/models/Product') return { findById() { throw Error('Unexpected catalog lookup') }, findByIdAndUpdate() { throw Error('Unexpected stock update') } }
    if (name === '@/models/Discount') return {}
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`)
    if (name.startsWith('.')) return load(path.join(path.dirname(file), `${name}.ts`))
    return require(name)
  }, exports)
  return exports
}
async function main() {
  const t = load('src/lib/garment-template.ts'), types = load('src/types/jacket-customization.ts')
  const defaults = t.getGarmentDefaults('hoodie')
  assert.equal(t.getGarmentCategory('custom-hoodie-v1'), 'hoodie')
  assert.equal(t.getGarmentPrice('hoodie', defaults), 55)
  assert.equal(defaults.Hood, undefined)
  assert.equal(defaults['Collar color'], undefined)
  const zip = { ...defaults, Closure: 'Full-zip', 'Pocket style': 'Split pockets' }
  assert.equal(t.getGarmentPrice('hoodie', zip), 57)
  for (const weight of ['Lightweight','Midweight','Heavyweight']) assert.equal(t.getGarmentPrice('hoodie', { ...zip, 'Fleece weight': weight, Fit: 'Relaxed' }),57)
  assert.throws(()=>t.validateGarmentOptions('hoodie',{...defaults,Closure:'Full-zip'}),/Pocket style/)
  assert.throws(()=>t.validateGarmentOptions('hoodie',{...defaults,'Body material':'Nylon'}))
  assert.throws(()=>t.validateGarmentOptions('hoodie',{...defaults,'Body color':'<script>'}))
  let renders=0
  for (const closure of ['Pullover','Full-zip']) for (const fit of ['Regular','Relaxed']) for (const sleeve of ['Set-in','Raglan']) for (const weight of ['Lightweight','Midweight','Heavyweight']) for (const lining of ['Matching fleece','Jersey']) for (const pocket of ['Yes','No']) {
    const options={...defaults,Closure:closure,Fit:fit,'Sleeve style':sleeve,'Fleece weight':weight,'Hood lining':lining,'Pocket style':pocket==='No'?'No pockets':closure==='Pullover'?'Kangaroo pocket':'Split pockets',Drawstrings:lining==='Jersey'?'Without drawstrings':'With drawstrings'}
    for(const view of types.JACKET_VIEWS){
      const svg=t.getGarmentSvg('hoodie',options,view)
      assert.ok(!svg.includes('undefined'))
      if(view==='front'){assert.equal(svg.includes('id="closure"'),closure==='Full-zip');assert.equal(svg.includes('id="pockets"'),pocket==='Yes');assert.equal(svg.includes('id="drawstrings"'),options.Drawstrings==='With drawstrings')}
      const {info}=await sharp(Buffer.from(svg)).resize(240).png().toBuffer({resolveWithObject:true});assert.equal(info.width,240);renders++
    }
  }
  const checkout=load('src/lib/checkout-order.ts'), Order=load('src/models/Order.ts').default
  const inventory=load('src/lib/inventory.ts')
  for (const options of [defaults,zip]) {
    const customization={garmentCategory:'hoodie',garmentOptions:options,snapshots:Object.fromEntries(types.JACKET_VIEWS.map(v=>[v,`https://example.com/${v}.png`]))}
    assert.equal(types.getCustomizedViews(customization).length,4)
    const item={productId:'custom-hoodie-v1',quantity:1,price:t.getGarmentPrice('hoodie',options),customization}
    const [resolved]=await checkout.resolveCheckoutItems([item]);assert.equal(resolved.price,item.price)
    const persisted=new Order({items:[resolved]}).toObject().items[0].customization
    assert.equal(persisted.garmentCategory,'hoodie');assert.equal(persisted.garmentOptions.get('Closure'),options.Closure)
    assert.equal(Object.keys(persisted.snapshots).length,4)
    await inventory.decrementStockForOrder([resolved])
    await assert.rejects(checkout.resolveCheckoutItems([{...item,price:1}]))
    await assert.rejects(checkout.resolveCheckoutItems([{...item,customization:{...customization,garmentCategory:'bomber'}}]))
  }
  for(const category of ['bomber','coach','puffer'])assert.equal(t.getGarmentPrice(category,t.getGarmentDefaults(category)),category==='coach'?55:57)
  fs.mkdirSync('output',{recursive:true})
  const panels=[]
  for(const [i,options] of [defaults,zip].entries())for(const [j,view] of ['front','back'].entries())panels.push({input:await sharp(Buffer.from(t.getGarmentSvg('hoodie',options,view))).flatten({background:'#f4f4f5'}).png().toBuffer(),left:j*720,top:i*720})
  await sharp({create:{width:1440,height:1440,channels:3,background:'#f4f4f5'}}).composite(panels).png().toFile('output/hoodie-design-views.png')
  console.log(`Passed ${renders} hoodie SVG renders, pullover/zip visibility, pocket validation, pricing, order storage, four snapshots, inventory bypass, and jacket pricing regression.`)
}
main().catch(e=>{console.error(e);process.exitCode=1})
