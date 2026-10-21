const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const compiled = ts.transpileModule(fs.readFileSync('src/lib/catalog-filters.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText
const exportsObject = {}; vm.runInNewContext(compiled,{exports:exportsObject,URLSearchParams})
const {readCatalogFilters,appendCatalogFilters,catalogFilterQuery}=exportsObject
const parsed=readCatalogFilters(new URLSearchParams('minPrice=-1&maxPrice=100&size=S&size=M&size=S&color=Black'))
assert.equal(parsed.minPrice,''); assert.equal(parsed.maxPrice,'100'); assert.equal(parsed.size.length,2)
assert.equal(JSON.stringify(readCatalogFilters(appendCatalogFilters(new URLSearchParams(),parsed))),JSON.stringify(parsed))
const mongo=catalogFilterQuery(parsed); assert.equal(mongo.$and.length,2); assert.equal(mongo.$and[0].variants.$elemMatch.value.$in.length,2)
console.log('PASS: input normalization, multi-select, URL roundtrip, AND/OR filter semantics')
const base='http://127.0.0.1:3000/api/products'
async function get(params) {const r=await fetch(`${base}?${params}`,{signal:AbortSignal.timeout(240000)}); assert.equal(r.status,200); return {data:await r.json(),total:Number(r.headers.get('x-total-count'))}}
;(async()=>{
 const {data:all}=await get('category=varsity-jackets&limit=1000')
 const {data:facets}=await get('category=varsity-jackets&facets=true')
 assert.ok(facets.groups.some(g=>g.key==='size'))
 const requests=[['maxPrice=70',p=>p.price<=70],['size=S&size=M',p=>p.variants?.some(v=>v.name==='Size'&&['S','M'].includes(v.value)&&v.inStock!==false)],['size=S&color=Black',p=>p.variants?.some(v=>v.name==='Size'&&v.value==='S'&&v.inStock!==false)&&p.variants?.some(v=>v.name==='Color'&&v.value==='Black'&&v.inStock!==false)],['minPrice=99999',p=>p.price>=99999]]
 for(const [query,match] of requests){const result=await get(`category=varsity-jackets&limit=1000&${query}`); const expected=all.filter(match); assert.equal(result.total,expected.length,query); assert.deepEqual(result.data.map(p=>p.id).sort(),expected.map(p=>p.id).sort(),query)}
 const page1=await get('category=varsity-jackets&maxPrice=100&sort=price&order=asc&limit=3&page=1')
 const page2=await get('category=varsity-jackets&maxPrice=100&sort=price&order=asc&limit=3&page=2')
 assert.equal(page1.total,page2.total); assert.ok(page1.data.at(-1).price<=page2.data[0].price)
 console.log('PASS: real catalog price/size/color filtering, full result counts, empty results and sorted pagination')
})().catch(error=>{console.error(error.message);process.exitCode=1})
