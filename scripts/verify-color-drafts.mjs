import 'dotenv/config'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
const plans=JSON.parse(await fs.readFile('output/color-drafts/draft-plan.json','utf8'))
try{
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
 const db=mongoose.connection.db,rows=[]
 for(const plan of plans){
  const p=await db.collection('products').findOne({slug:plan.product.slug})
  assert.equal(p.name,plan.product.name);assert.equal(p.isDraft,true);assert.equal(p.status,'inactive');assert.equal(p.price,plan.product.price);assert.equal(String(p.categoryId),plan.product.categoryId)
  assert.ok(!Object.hasOwn(p,'landingPages'))
  for(const [key,value] of Object.entries(plan.product))if(!['categoryId','images'].includes(key))assert.deepEqual(p[key],value,`${p.name}: ${key}`)
  const productFaqs=await db.collection('faqs').find({displayPages:p.slug,status:'draft'}).sort({order:1}).toArray()
  const count=productFaqs.length
  assert.equal(count,3)
  for(let i=0;i<3;i++){assert.equal(productFaqs[i].question,plan.faqs[i].question);assert.deepEqual(productFaqs[i].answer,plan.faqs[i].answer)}
  if(process.argv.includes('--require-images')){
   assert.equal(p.images.length,4,`${p.name}: incomplete image set`)
   assert.deepEqual(p.images.map(image=>image.order),[0,1,2,3])
   for(let v=0;v<4;v++)assert.equal(p.images[v].alt,`${p.name}, ${plan.imagePrompts[v].view} view`)
  }
  rows.push({name:p.name,id:String(p._id),images:p.images.length,faqs:count,status:p.status,isDraft:p.isDraft,reviewIssues:plan.reviewIssues})
 }
 await fs.writeFile('output/color-drafts/verification.json',JSON.stringify(rows,null,2))
 console.log(JSON.stringify({products:rows.length,draftFaqs:rows.reduce((n,r)=>n+r.faqs,0),images:rows.reduce((n,r)=>n+r.images,0),completeImageSets:rows.filter(r=>r.images===4).length,allHidden:true},null,2))
}finally{await mongoose.disconnect()}
