const assert = require('node:assert/strict'); const fs=require('node:fs'); const vm=require('node:vm'); const ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync('src/lib/custom-design-links.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const out={};vm.runInNewContext(compiled,{exports:out});
const expected={'varsity-jackets':'/design/varsity','bomber-jackets':'/design/bomber','puffer-jackets':'/design/puffer','coach-jackets':'/design/coach','fleece-hoodies':'/design/hoodie','denim-jackets':'/custom-denim-jackets','patches-embroidery':'/contact','leather-jackets':'/contact','leather-vest':'/contact','leather-biker-jacket':'/contact','shearling-jacket':'/contact','leather-coat':'/contact'};
for(const [root,path] of Object.entries(expected)) {const link=out.getCustomDesignLink([root,'material-subcategory']);assert.equal(link.href,path,root);assert.ok(fs.existsSync('src/app'+path+'/page.tsx'),path);if(path==='/contact')assert.equal(link.interactive,false);}
assert.equal(out.getCustomDesignLink(['varsity-jackets','wool-leather']).href,'/design/varsity');
console.log('PASS: collection inheritance, supported designers, service fallbacks, and all destination routes');
