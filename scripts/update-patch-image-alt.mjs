import 'dotenv/config'
import mongoose from 'mongoose'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
const saved = JSON.parse(await readFile('src/data/patch-images.json', 'utf8'))
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
try {
 const collection=mongoose.connection.db.collection('sectionimages')
 const records=await collection.find({section:'patches-embroidery'}).toArray()
 const changes=records.flatMap(record=>{
  const image=saved.find(image=>image.key===record.key && image.url===record.url)
  return image && record.alt!==image.alt ? [{record,alt:image.alt}] : []
 })
 console.log(`${records.length} section images; ${changes.length} matching descriptions to update.`)
 if(process.argv.includes('--apply') && changes.length){
  await mkdir('output',{recursive:true})
  await writeFile(`output/patch-alt-backup-${Date.now()}.json`,JSON.stringify(changes.map(({record})=>record),null,2))
  const result=await collection.bulkWrite(changes.map(({record,alt})=>({updateOne:{filter:{_id:record._id,url:record.url,alt:record.alt},update:{$set:{alt,updatedAt:new Date()}}}})))
  console.log(`Updated ${result.modifiedCount} patch descriptions.`)
 }
} finally { await mongoose.disconnect() }
