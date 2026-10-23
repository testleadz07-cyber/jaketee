import assert from 'node:assert/strict'
import fs from 'node:fs'
const {rows}=JSON.parse(fs.readFileSync('docs/product-care/product-care.json','utf8'))
const library=JSON.parse(fs.readFileSync('content/care-blocks.json','utf8'))
const find=name=>rows.find(r=>r.productName===name)
assert.equal(rows.length,138)
assert.equal(library.length,17)
assert.deepEqual(find('Black Wool and Yellow Leather Sleeves Letterman Jacket').blockIds,['melton-polyester','cowhide-leather','fill','self-fabric-lining'])
assert.deepEqual(find('Luxurious All-Black Nappa Leather Letterman Jacket').blockIds,['sheep-lambskin','fill','self-fabric-lining'])
assert.equal(find('Royal Blue Wool and Red Leather Sleeves Letterman Jacket').status,'NEEDS REVIEW')
assert.ok(!find('Royal Blue Wool and Red Leather Sleeves Letterman Jacket').blockIds.includes('lining'))
assert.ok(find('Camel Brown Suede Leather Bomber Jacket').blockIds.includes('suede'))
assert.ok(!find('Camel Brown Suede Leather Bomber Jacket').blockIds.includes('cowhide-leather'))
assert.ok(!find('Camel Brown Suede Leather Bomber Jacket').blockIds.includes('sheep-lambskin'))
assert.deepEqual(find('Denim Varsity Jacket Cotton Twill Sleeves').blockIds,['denim','cotton-twill','self-fabric-lining'])
assert.ok(find('Floral Embroidered Denim Jacket').blockIds.includes('decoration'))
assert.ok(!find('Black Wool and Yellow Leather Sleeves Letterman Jacket').blockIds.includes('decoration'))
assert.equal(find('Leather Puffer Jacket').status,'NEEDS REVIEW')
for(const b of library){
 assert.equal(b.do.length,2)
 assert.equal(b.avoid.length,2)
 assert.ok(!/\u2014|\b(?:don't|can't|won't|isn't|it's)\b/i.test(JSON.stringify(b)))
 assert.ok(!/like (?:a suit|real skin)/i.test(JSON.stringify(b)))
}
for(const r of rows){
 assert.ok(r.fullCareHTML.endsWith('<p>For custom orders, follow any care label sewn inside your jacket.</p>'))
 if(r.status==='NEEDS REVIEW') assert.ok(r.fullCareHTML.includes('NEEDS REVIEW'))
 if(r.blockIds.includes('fill') && r.blockIds.includes('lining')) assert.ok(r.blockIds.indexOf('fill')<r.blockIds.indexOf('lining'))
 if(r.blockIds.includes('decoration')) assert.equal(r.blockIds.at(-1),'decoration')
}
assert.ok(find('Black Wool and Yellow Leather Sleeves Letterman Jacket').reviewReasons.some(s=>s.includes('cowhide')))
for(const r of rows.filter(r=>r.productName!=='Letterman Patch Packs')) assert.ok(r.blockIds.includes('self-fabric-lining'))
console.log('Care library checks passed: 17 blocks, all 138 products, owner-confirmed blends and lining, and conflict holds.')
