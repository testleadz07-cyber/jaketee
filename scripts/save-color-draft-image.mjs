import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import mongoose from 'mongoose'
import {v2 as cloudinary} from 'cloudinary'
const [indexText,viewText,sourceHint]=process.argv.slice(2),index=Number(indexText),view=Number(viewText)
const source=sourceHint?.slice(sourceHint.search(/[A-Z]:\\[^]*$/))?.split(/ as (?=[A-Z]:\\)/).at(-1)
const plans=JSON.parse(await fs.readFile('output/color-drafts/draft-plan.json','utf8')),plan=plans[index]
assert.ok(plan&&plan.imagePrompts[view]&&source)
const folder=path.resolve('output/color-drafts/images',plan.product.slug)
await fs.mkdir(folder,{recursive:true})
const revision=process.argv.includes('--revision-v2')?'-v2':''
const destination=path.join(folder,`${['front','back','left-sleeve','right-sleeve'][view]}${revision}.jpg`)
const xmp='<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"/></rdf:RDF></x:xmpmeta>'
if(path.resolve(source)!==destination) await sharp(source).resize(2000,2000,{fit:'contain',background:'#eeeeee'}).withXmp(xmp).jpeg({quality:95}).toFile(destination)
await fs.writeFile(path.join(folder,`${view}-source.json`),JSON.stringify({source,destination,prompt:plan.imagePrompts[view].prompt},null,2))
const metadata=await sharp(destination).metadata()
assert.equal(metadata.width,2000);assert.equal(metadata.height,2000);assert.ok(metadata.xmp.toString().includes('trainedAlgorithmicMedia'))
cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true})
let upload
for(let attempt=0;attempt<3;attempt++){
 try{upload=await cloudinary.uploader.upload(destination,{public_id:`jacketee/draft-products/${plan.product.slug}/${path.basename(destination,'.jpg')}`,overwrite:false,resource_type:'image',format:'jpg',timeout:120000});break}
 catch(error){if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,3000))}
}
const remote=Buffer.from(await (await fetch(upload.secure_url)).arrayBuffer())
assert.ok((await sharp(remote).metadata()).xmp?.toString().includes('trainedAlgorithmicMedia'),'Cloud-hosted original lost AI metadata')
try{
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
 const products=mongoose.connection.db.collection('products')
 const p=await products.findOne({slug:plan.product.slug,status:'inactive',isDraft:true})
 assert.ok(p,'Only inactive drafts may be changed')
 const image={url:upload.secure_url,alt:`${plan.product.name}, ${plan.imagePrompts[view].view} view`,order:view}
 const images=[...p.images.filter(i=>i.order!==view),image].sort((a,b)=>a.order-b.order)
 const result=await products.updateOne({_id:p._id,status:'inactive',isDraft:true,images:p.images},{$set:{images,updatedAt:new Date()}})
 assert.equal(result.matchedCount,1,'Image changed concurrently; retry')
 await fs.writeFile(path.join(folder,`${view}.json`),JSON.stringify({source,destination,image,prompt:plan.imagePrompts[view].prompt,revision:revision||undefined,metadataVerified:true},null,2))
 console.log(`Saved ${index+1}/40 ${plan.imagePrompts[view].view}: ${destination}`)
}finally{await mongoose.disconnect()}
