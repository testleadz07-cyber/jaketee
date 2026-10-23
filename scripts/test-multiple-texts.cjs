/* eslint-disable @typescript-eslint/no-require-imports -- Server and canvas regression tests with mocked product lookup. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript')
const cache=new Map()
function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file)
  const exports={};cache.set(file,exports)
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText
  new Function('require','exports',js)(name=>{
    if(name==='@/models/Product')return {findById(id){if(id!=='507f1f77bcf86cd799439011')throw Error('Unexpected product lookup');return {lean:async()=>({_id:id,name:'Test catalog jacket',status:'active',inStock:true,stockCount:10,price:100,variants:[{name:'Size',value:'M',inStock:true,priceAdjust:0}],embroidery:{available:true,maxChars:6}})}}}
    if(name==='@/models/Discount')return {}
    if(name==='@/components/jacket-artwork-catalog')return {getJacketFontFamily:()=> 'sans-serif'}
    if(name.startsWith('@/'))return load(`src/${name.slice(2)}.ts`)
    if(name.startsWith('.'))return load(path.join(path.dirname(file),`${name}.ts`))
    return require(name)
  },exports);return exports
}
async function main(){
  const types=load('src/types/jacket-customization.ts'),pricing=load('src/lib/customization-pricing.ts')
  const checkout=load('src/lib/checkout-order.ts'),template=load('src/lib/garment-template.ts'),varsity=load('src/lib/varsity-template.ts')
  const text={value:'NY',color:'#ffffff',fontStyle:'varsity',layout:'straight',size:42,x:.5,y:.38}
  const texts=[{...text,id:'ny'},{...text,id:'class',value:'CLASS OF 2026',layout:'curve-up',color:'#dc2626',y:.55}]
  assert.equal(types.getJacketTexts({text}).length,1)
  assert.equal(types.getJacketTexts({text,texts:[]}).length,0,'Removed legacy text does not reappear')
  assert.equal(types.getJacketTextSummary({texts}),'NY, CLASS OF 2026')
  assert.deepEqual(types.getCustomizedViews({leftSleeve:{texts}}),['leftSleeve'])
  assert.ok(types.hasJacketCustomization({front:{texts}}))
  const legacyFee=pricing.getCustomizationFee({front:{text}})
  assert.equal(legacyFee,pricing.getCustomizationFee({front:{texts:[texts[0]]}}))
  assert.ok(pricing.getCustomizationFee({front:{texts}})>legacyFee)
  assert.equal(pricing.getCustomizationFee({front:{texts:[{...text,id:'blank',value:'  '}]}}),0)
  const Order=load('src/models/Order.ts').default
  for(const category of ['varsity',...template.GARMENT_CATEGORIES]){
    const options=category==='varsity'?varsity.DEFAULT_VARSITY_OPTIONS:template.getGarmentDefaults(category)
    const config=category==='varsity'?{varsityOptions:options}:{garmentCategory:category,garmentOptions:options}
    const base=category==='varsity'?varsity.getVarsityPrice(options):template.getGarmentPrice(category,options)
    const customization={...config,front:{texts},back:{texts:[{...text,id:'back',value:'BACK'}]},leftSleeve:{texts:[{...text,id:'sleeve',value:'SLEEVE',layout:'vertical'}]}}
    const item={productId:`custom-${category}-v1`,quantity:1,price:Number((base+pricing.getCustomizationFee(customization)).toFixed(2)),customization}
    const [resolved]=await checkout.resolveCheckoutItems([item])
    assert.equal(resolved.customization.front.texts.length,2)
    assert.equal(resolved.customization.front.texts[1].layout,'curve-up')
    assert.equal(resolved.customization.front.text,undefined)
    const persisted=new Order({items:[resolved]}).toObject().items[0].customization
    assert.equal(persisted.front.texts[1].value,'CLASS OF 2026')
    const invalid=async badTexts=>checkout.resolveCheckoutItems([{...item,customization:{...customization,front:{texts:badTexts}}}])
    await assert.rejects(invalid([texts[0],texts[0]]),/text ID/)
    await assert.rejects(invalid(Array.from({length:13},(_,i)=>({...text,id:String(i)}))),/text collection/)
    await assert.rejects(invalid([{...text,id:'bad',value:'A'.repeat(25)}]),/embroidered text/)
    await assert.rejects(invalid([{...text,id:'bad',layout:'unsupported'}]),/layout/)
    await assert.rejects(checkout.resolveCheckoutItems([{...item,price:base+legacyFee}]),/price/)
    const legacy={...config,front:{text}}
    const [old]=await checkout.resolveCheckoutItems([{...item,price:Number((base+legacyFee).toFixed(2)),customization:legacy}])
    assert.equal(old.customization.front.texts[0].value,'NY')
    const oldDocument=new Order({items:[{...item,customization:legacy}]}).toObject().items[0].customization
    assert.equal(oldDocument.front.texts,undefined)
    assert.equal(types.getJacketTextSummary(oldDocument.front),'NY')
  }
  const drawn=[];const context={clearRect(){},fillRect(){},save(){},restore(){},translate(){},rotate(){},scale(){},setLineDash(){},strokeRect(){},strokeText(){},fillText(value){drawn.push(value)},measureText(value){return {width:value.length*20}}}
  load('src/lib/jacket-design-preview.ts').drawJacketDesign({getContext:()=>context},null,{texts},new Map(),42)
  assert.ok(drawn.includes('NY'));assert.ok(drawn.includes('C'))
  const productCustomization={front:{texts:[texts[0],{...texts[1],value:'TEAM'}]}}
  const productItem={productId:'507f1f77bcf86cd799439011',quantity:1,variants:[{name:'Size',value:'M'}],price:Number((100+pricing.getCustomizationFee(productCustomization)).toFixed(2)),customization:productCustomization}
  const [catalog]=await checkout.resolveCheckoutItems([productItem])
  assert.equal(catalog.customization.front.texts.length,2)
  await assert.rejects(checkout.resolveCheckoutItems([{...productItem,customization:{front:{texts:[{...texts[0],value:'TOO LONG'}]}}}]),/embroidered text/)
  console.log('Passed all five templates: multiple text rendering, summaries, per-text pricing, legacy conversion, order persistence, IDs/limits/layout validation, and underpayment rejection.')
}
main().catch(e=>{console.error(e);process.exitCode=1})
