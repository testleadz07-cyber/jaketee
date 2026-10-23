import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { compactCare } from './product-care-compact.mjs'
const APPLY=process.argv.includes('--apply')
const dir='docs/product-care'
const source=JSON.parse(await fs.readFile(`${dir}/source.json`,'utf8'))
const {rows}=JSON.parse(await fs.readFile(`${dir}/product-care.json`,'utf8'))
const plan=rows.map(row=>{
 const {profile,careInstructions}=compactCare(row)
 const words=careInstructions.split(/\s+/).length
 assert.ok(words<=150, `${row.productName}: care copy too long (${words} words)`)
 assert.equal((careInstructions.match(/^Do:/gm)||[]).length,2)
 assert.equal((careInstructions.match(/^Avoid:/gm)||[]).length,2)
 assert.ok(!/NEEDS REVIEW|Avoid: Avoid|Puffer \/ Down|Lining in the Same|like a suit|real skin/i.test(careInstructions))
 return {id:row.productId,name:row.productName,careInstructions,profile,wordCount:words,specificationIssues:row.reviewReasons,approach:'One compact product care block; conservative guidance where material details remain unclear'}
})
assert.equal(plan.length,source.products.length)
await fs.writeFile(`${dir}/care-update-plan.json`,JSON.stringify({authorizedBy:'Store owner in conversation; update with backup',products:plan},null,2)+'\n')
if(!APPLY){console.log(`Validated care update plan for ${plan.length} products. No database writes.`)}
else try {
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
 const collection=mongoose.connection.db.collection('products')
 const products=await collection.find({_id:{$in:plan.map(p=>new mongoose.Types.ObjectId(p.id))}}).toArray()
 assert.equal(products.length,plan.length)
 for(const original of source.products){
  const current=products.find(p=>String(p._id)===original._id)
  for(const [key,value] of Object.entries(original)) if(!['_id','updatedAt'].includes(key)) assert.equal(JSON.stringify(current[key]),JSON.stringify(value),`${original.name}: ${key} changed; refresh source before applying`)
 }
 const backupDir=path.resolve('output','product-care-backups',new Date().toISOString().replace(/[:.]/g,'-'))
 await fs.mkdir(backupDir,{recursive:true})
 const backupPath=path.join(backupDir,'products-before.ejson')
 const EJSON=mongoose.mongo.BSON.EJSON
 await fs.writeFile(backupPath,EJSON.stringify(products,null,2,{relaxed:false}),{flag:'wx'})
 const backup=EJSON.parse(await fs.readFile(backupPath,'utf8'),{relaxed:false})
 assert.equal(backup.length,products.length)
 for(let i=0;i<products.length;i++)assert.equal(EJSON.stringify(backup[i],{relaxed:false}),EJSON.stringify(products[i],{relaxed:false}))
 const journal={startedAt:new Date().toISOString(),backupPath,total:plan.length,completed:[],status:'running',batches:[]}
 const journalPath=path.join(backupDir,'journal.json')
 await fs.writeFile(journalPath,JSON.stringify(journal,null,2))
 for(let start=0;start<plan.length;start+=10){
  const batch=plan.slice(start,start+10)
  for(const item of batch){
   const current=products.find(p=>String(p._id)===item.id)
   const filter={_id:current._id,...(current.updatedAt?{updatedAt:current.updatedAt}:{}),...(Object.hasOwn(current,'careInstructions')?{careInstructions:current.careInstructions}:{careInstructions:{$exists:false}})}
   const result=await collection.updateOne(filter,{$set:{careInstructions:item.careInstructions,updatedAt:new Date()}})
   assert.equal(result.matchedCount,1,`${item.name}: concurrent modification; stopped, consult backup journal`)
   journal.completed.push(item.id)
   await fs.writeFile(journalPath,JSON.stringify(journal,null,2))
  }
  journal.batches.push({batch:journal.batches.length+1,count:batch.length})
 }
 const after=await collection.find({_id:{$in:products.map(p=>p._id)}}).toArray()
 for(const original of products){
  const current=after.find(p=>String(p._id)===String(original._id))
  const planned=plan.find(p=>p.id===String(original._id))
  assert.equal(current.careInstructions,planned.careInstructions)
  const omit=p=>Object.fromEntries(Object.entries(p).filter(([key])=>!['careInstructions','updatedAt'].includes(key)))
  assert.deepEqual(omit(current),omit(original),'Unexpected changes outside care instructions')
 }
 journal.status='verified';journal.verifiedAt=new Date().toISOString()
 await fs.writeFile(journalPath,JSON.stringify(journal,null,2))
 await fs.writeFile(`${dir}/care-update-published.json`,JSON.stringify(journal,null,2)+'\n')
 console.log(JSON.stringify({updated:after.length,verified:true,batches:journal.batches.length,backupPath,report:`${dir}/care-update-published.json`}))
} finally {await mongoose.disconnect()}
