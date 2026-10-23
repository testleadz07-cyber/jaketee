import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const require=createRequire(import.meta.url)
const load=(file)=>{
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
 const loadedModule={exports:{}}
 new Function('require','module','exports',code)(require,loadedModule,loadedModule.exports)
 return loadedModule.exports
}
const {ProductCopy}=load('src/components/product-copy.tsx')
const html=renderToStaticMarkup(React.createElement(ProductCopy,{description:'Specific wool jacket.\n\nDetails\n- Body: wool\n- Sleeves: leather\n\nCustomization options\nNames available.',specificationDetails:'Specifications\nSpecifications:\nBody: wool',careInstructions:'Care Instructions\nCare instructions:\nDo not soak. <script>alert(1)</script>'}))
assert.equal((html.match(/>Specifications<\/h3>/g)||[]).length,1)
assert.equal((html.match(/>Care instructions<\/h3>/g)||[]).length,1)
assert.equal((html.match(/Specifications/g)||[]).length,1)
assert.equal((html.match(/Care instructions/gi)||[]).length,1)
assert.ok(html.includes('<li>Body: wool</li>'))
assert.ok(!html.includes('<script>'))
assert.equal((html.match(/<details\b/g)||[]).length,5)
assert.equal((html.match(/<summary\b/g)||[]).length,5)
assert.equal((html.match(/<details open=""/g)||[]).length,1)
assert.ok(html.includes('>Overview</h3>'))
const {productMetaTitle}=load('src/lib/seo-metadata.ts')
assert.equal(productMetaTitle('Catalog name','Red Wool Varsity Jacket | Jacketee'),'Red Wool Varsity Jacket | Jacketee')
assert.ok(productMetaTitle('A very long product name '.repeat(8)).length<=60)
console.log('Product copy rendering and metadata tests passed.')
