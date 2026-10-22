const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/collection-design-images.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2019}}).outputText,{exports:out});
const resolve=out.collectionDesignImages;
const categories=[{id:'root',name:'Varsity',productImages:['/root.webp']},{id:'wool',parentId:'root',name:'All wool',productImages:['','/wool.webp','/wool-back.webp']},{id:'hooded',parentId:'root',name:'Hooded',productImages:['/hooded.webp']},{id:'empty',parentId:'root',name:'Empty',productImages:[]},{id:'denim',name:'Denim',productImages:['/denim.webp']}];
assert.equal(resolve(categories,'wool')[0],'/wool.webp');assert.ok(!resolve(categories,'wool').includes('/hooded.webp'));assert.ok(resolve(categories,'root').includes('/wool.webp'));assert.equal(resolve(categories,'empty')[0],'/root.webp');assert.equal(resolve(categories,'denim')[0],'/denim.webp');assert.equal(resolve([{id:'r',name:'Root'},{id:'c',parentId:'r',name:'Child',productImages:['/child.webp']}],'r')[0],'/child.webp');
console.log('PASS: exact subcategory first, descendants, empty image skipping, family fallback, no unrelated siblings');

if(process.argv.includes('--live')) (async()=>{
 const [cats,products]=await Promise.all([fetch('http://127.0.0.1:3000/api/categories').then(r=>r.json()),fetch('http://127.0.0.1:3000/api/products?limit=1000').then(r=>r.json())]);
 const nodes=cats.map(cat=>({...cat,productImages:products.filter(p=>p.category?._id===cat.id).flatMap(p=>p.images.map(i=>i.url))}));
 const populated=nodes.filter(c=>c._count.products>0); const missing=populated.filter(c=>!resolve(nodes,c.id).length);
 assert.equal(missing.length,0,JSON.stringify(missing.map(c=>c.slug)));
 console.log('PASS: related images available for all '+populated.length+' populated categories/subcategories');
 console.log(JSON.stringify(nodes.filter(c=>!resolve(nodes,c.id).length).map(c=>({slug:c.slug,products:c._count.products})),null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
