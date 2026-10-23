import 'dotenv/config'
import fs from 'node:fs/promises'
import mongoose from 'mongoose'
const file=process.argv.find(a=>a.startsWith('--file='))?.slice(7) || 'docs/product-content-review/batch-01-drafts.json'
const batch=JSON.parse(await fs.readFile(file,'utf8'))
const apply=process.argv.includes('--apply')
const errors=[]
if(batch.length!==10) errors.push('A review batch must contain exactly 10 products.')
if(new Set(batch.map(r=>r.id)).size!==batch.length) errors.push('Duplicate product IDs.')
for(const row of batch){
 const p=row.proposed
 if(!p || !p.description || !p.specificationDetails || !p.careInstructions){errors.push(`${row.id}: incomplete copy`);continue}
 if(!p.seoTitle.endsWith(' | Jacketee') || p.seoTitle.length>60) errors.push(`${row.id}: title must end in | Jacketee and be <=60 characters`)
 if(p.seoDescription.length<140 || p.seoDescription.length>155 || !/[.!?]$/.test(p.seoDescription)) errors.push(`${row.id}: meta must be 140–155 characters and end with sentence punctuation`)
 if(/designed\s+in\s+usa|puffer jackets/i.test(JSON.stringify(p))) errors.push(`${row.id}: obsolete origin or generic puffer copy`)
 if(!p.description.includes('\n\nDetails\n- ') || !p.description.includes('\n\nCustomization options\n')) errors.push(`${row.id}: missing description sections`)
 if(apply && (row.review.status!=='approved' || !row.review.reviewer?.trim() || !Number.isFinite(Date.parse(row.review.reviewedAt)) || row.unresolved.length)) errors.push(`${row.id}: human approval, reviewer, review date and resolved fact gaps are required`)
}
if(new Set(batch.map(r=>r.proposed.description)).size!==batch.length) errors.push('Duplicate descriptions in review batch.')
if(errors.length) { console.error(errors.join('\n')); process.exitCode=1 }
else if(!apply) console.log(`Validated ${batch.length} drafts. Read-only; no publishing. Publishing requires --apply and approved reviews.`)
else {
 // Refresh every field before replacing the obsolete origin; reject stale evidence.
 const replaceOrigin=value=>typeof value==='string'?value.replace(/designed\s+in\s+usa/gi,'Made in our Sialkot factory'):Array.isArray(value)?value.map(replaceOrigin):value && typeof value==='object' && Object.getPrototypeOf(value)===Object.prototype?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replaceOrigin(v)])):value
 try {
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
  const collection=mongoose.connection.db.collection('products')
  const originals=[]
  for(const row of batch){
   const current=await collection.findOne({_id:new mongoose.Types.ObjectId(row.id)})
   if(!current || new Date(current.updatedAt).toISOString()!==new Date(row.sourceUpdatedAt).toISOString()) throw new Error(`${row.id}: source changed; audit and review again`)
   for(const [key,value] of Object.entries(row.source)) if(JSON.stringify(current[key])!==JSON.stringify(value)) throw new Error(`${row.id}: ${key} changed; review again`)
   originals.push(current)
  }
  const backup=`${file}.before-${Date.now()}.json`
  await fs.writeFile(backup,JSON.stringify(originals,null,2)+'\n',{flag:'wx'})
  for(let i=0;i<batch.length;i++){
   const row=batch[i], current=originals[i]
   const set={...row.proposed,updatedAt:new Date()}
   for(const [key,value] of Object.entries(current)){
    if(key==='_id') continue
    const replacement=replaceOrigin(value)
    if(JSON.stringify(replacement)!==JSON.stringify(value) && !(key in row.proposed)) set[key]=replacement
   }
   const result=await collection.updateOne({_id:current._id,updatedAt:current.updatedAt},{$set:set})
   if(result.matchedCount!==1) throw new Error(`${row.id}: concurrent change; stopped. Earlier products may have been applied; see ${backup}`)
  }
  console.log(`Published reviewed batch of ${batch.length}. Backup: ${backup}`)
 } finally { await mongoose.disconnect() }
}
