const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const source = ts.transpileModule(fs.readFileSync('src/lib/home-featured.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText
const moduleObject = { exports: {} }
vm.runInNewContext(source, { exports: moduleObject.exports })
const { selectHomeFeatured } = moduleObject.exports
const categories = [
  { id: 'b', name: 'Bomber', slug: 'bomber-jackets' },
  { id: 'v', name: 'Varsity', slug: 'varsity-jackets' },
  { id: 's', name: 'Satin', slug: 'satin', parentId: 'v' },
  { id: 'w', name: 'Wool', slug: 'wool', parentId: 'v' },
  { id: 'e', name: 'Empty', slug: 'empty', parentId: 'v' },
  { id: 'g', name: 'Wool blend', slug: 'wool-blend', parentId: 'w' },
]
const full = selectHomeFeatured(categories, new Map([['b', ['b1']], ['s', ['s1']], ['w', ['w1']], ['g', ['g1', 'g2']]]))
assert.equal(full.selections.length, 5)
assert.equal(new Set(full.selections.map(x => x.productId)).size, 5)
assert.equal(full.selections[0].category.slug, 'varsity-jackets')
assert.equal(full.selections.at(-1).category.slug, 'bomber-jackets')
assert.equal(full.unmatched.length, 0)
assert.equal(full.empty[0].id, 'e')
const scarce = selectHomeFeatured(categories, new Map([['s', ['only']]]))
assert.equal(scarce.selections.length, 1)
assert.equal(scarce.selections[0].category.id, 's')
assert.equal(scarce.unmatched[0].id, 'v')
const direct = selectHomeFeatured(categories, new Map([['v', ['v1']], ['s', ['s1']]]))
assert.equal(direct.selections[0].productId, 'v1')
assert.equal(direct.selections[1].productId, 's1')
const cycle = selectHomeFeatured([{ id:'a', parentId:'c', name:'A', slug:'a' }, { id:'c', parentId:'a', name:'C', slug:'c' }], new Map([['a',['1','2']]]))
assert.equal(cycle.selections.length, 2)
console.log('PASS: all depths, Varsity-first order, unique matching, reassignment, empty categories, scarce products, and cycle protection')

if (process.argv.includes('--catalog')) {
  require('@next/env').loadEnvConfig(process.cwd())
  const mongoose = require('mongoose')
  ;(async () => {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
    try {
      const cats = await mongoose.connection.db.collection('categories').find({}).toArray()
      const rows = await mongoose.connection.db.collection('products').aggregate([
        { $match: { inStock:true, isDraft: { $ne:true }, status:'active' } },
        { $sort: { isFeatured:-1, createdAt:-1, _id:1 } },
        { $group: { _id:'$categoryId', products: { $push:'$_id' } } },
        { $project: { products: { $slice:['$products', Math.max(cats.length,1)] } } },
      ]).toArray()
      const result = selectHomeFeatured(cats.map(c=>({ id:String(c._id), parentId:c.parentId?String(c.parentId):null, name:c.name, slug:c.slug })), new Map(rows.map(row=>[String(row._id),row.products.map(String)])), ['varsity-jackets','bomber-jackets','leather-jackets','puffer-jackets','coach-jackets','denim-jackets'])
      assert.equal(new Set(result.selections.map(x=>x.productId)).size, result.selections.length)
      const report = { totalCategories:cats.length, represented:result.selections.length, empty:result.empty.map(c=>c.slug), unmatched:result.unmatched.map(c=>c.slug), selections:result.selections.map(x=>({category:x.category.name,slug:x.category.slug,productId:x.productId})) }
      fs.mkdirSync('output/home-featured',{recursive:true})
      fs.writeFileSync('output/home-featured/coverage.json',JSON.stringify(report,null,2))
      console.log(JSON.stringify({totalCategories:report.totalCategories,represented:report.represented,empty:report.empty,unmatched:report.unmatched}))
    } finally { await mongoose.disconnect() }
  })().catch(()=>{ console.error('Catalog audit failed: database connection or query unavailable'); process.exitCode=1 })
}
