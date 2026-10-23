import 'dotenv/config'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import sharp from 'sharp'
const root='output/jacketee-batch-1'
try{
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
  const db=mongoose.connection.db
  const products=await db.collection('products').find({sourceBatch:'jacketee-batch-1'}).sort({slug:1}).toArray()
  assert.equal(products.length,11)
  const faqs=await db.collection('faqs').find({sourceBatch:'jacketee-batch-1'}).toArray()
  assert.equal(faqs.length,33)
  const summaries=[]
  for(const p of products){
    assert.equal(p.isDraft,true);assert.equal(p.status,'inactive');assert.equal(p.price,60);assert.equal(p.currency,'USD');assert.deepEqual(p.landingPages,[])
    assert.deepEqual(p.variants.filter(v=>v.name==='Size').map(v=>v.value),['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL'])
    const category=await db.collection('categories').findOne({_id:p.categoryId})
    assert.ok(category)
    assert.equal(category.slug,p.slug==='black-and-pink-cheer-varsity-jacket'?'satin':p.slug==='vintage-navy-and-gold-letterman-jacket'?'retro':'wool-leather')
    const words=p.description.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').split(/\s+/).length
    assert.ok(words>=150&&words<=220)
    assert.ok(p.description.includes('Made in 6\u20137 business days after design approval. Delivery in 5\u20137 business days.'))
    assert.ok(p.description.includes('Made in our Sialkot factory.'))
    assert.ok(p.description.includes('[custom letterman jacket](/custom-letterman-jackets)'))
    assert.equal(faqs.filter(f=>f.status==='draft'&&f.displayPages.includes(p.slug)).length,3)
    assert.equal(p.images.length,4,`${p.slug} image count`)
    assert.deepEqual(p.images.map(i=>i.order),[0,1,2,3])
    for(const [order,view] of ['front','back','left sleeve','right sleeve'].entries()){
      const receipt=JSON.parse(await fs.readFile(`${root}/images/${p.slug}/${view.replaceAll(' ','-')}.receipt.json`,'utf8'))
      assert.equal(p.images[order].url,receipt.image.url)
      assert.equal(p.images[order].alt,`${p.name}, ${view} view`)
      assert.equal(receipt.metadataVerified,true)
      const meta=await sharp(receipt.destination).metadata()
      assert.equal(meta.width,2000);assert.equal(meta.height,2000);assert.ok(meta.xmp?.toString().includes('trainedAlgorithmicMedia'))
    }
    summaries.push(`- ${p.name}: $60 USD; ${words} description words; 3 draft FAQs; 4 images verified.`)
  }
  const report=`# Batch 1 verification\n\nVerified ${new Date().toISOString()}. All 11 products are inactive drafts, XXS–6XL, without landing-page assignments. All 44 local images are 2000 × 2000 with AI-source metadata; upload receipts confirm hosted originals retain metadata. FAQs remain drafts for review.\n\n${summaries.join('\n')}\n\nOversized pattern confirmed. Finished garment measurements are still required to populate the Oversized chart. Replace generated imagery with factory photographs once samples are ready.\n\nGeneration: built-in imagegen. Final images and exact prompt set: output/jacketee-batch-1/images and output/jacketee-batch-1/image-sources.json.\n`
  await fs.writeFile('docs/jacketee-batch-1/verification.md',report)
  console.log('Verified 11 inactive drafts, 33 draft FAQs and 44 images. Report: docs/jacketee-batch-1/verification.md')
}finally{await mongoose.disconnect()}
