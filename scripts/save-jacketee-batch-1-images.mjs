import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import mongoose from 'mongoose'
import {v2 as cloudinary} from 'cloudinary'

const root='output/jacketee-batch-1'
const jobs=JSON.parse(await fs.readFile(`${root}/image-sources.json`,'utf8'))
const xmp='<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"/></rdf:RDF></x:xmpmeta>'
cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true})
try {
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
  const products=mongoose.connection.db.collection('products')
  for(const job of jobs){
    if(process.argv.includes('--skip-patches') && ['black-and-gold-senior-letterman-jacket','red-and-white-cheer-letterman-jacket'].includes(job.slug)) continue
    const p=await products.findOne({slug:job.slug,isDraft:true,status:'inactive',sourceBatch:'jacketee-batch-1'})
    assert.ok(p,`Missing draft ${job.slug}`)
    const folder=path.resolve(root,'images',p.slug)
    await fs.mkdir(folder,{recursive:true})
    const view=job.view.replaceAll(' ','-')
    const destination=path.join(folder,`${view}.jpg`)
    const receipt=path.join(folder,`${view}.receipt.json`)
    try{await fs.access(receipt);console.log(`Already saved: ${p.slug} ${view}`);continue}catch{}
    await sharp(job.source).resize(2000,2000,{fit:'contain',background:'#eeeeee'}).withXmp(xmp).jpeg({quality:95}).toFile(destination)
    const meta=await sharp(destination).metadata()
    assert.equal(meta.width,2000);assert.equal(meta.height,2000);assert.ok(meta.xmp?.toString().includes('trainedAlgorithmicMedia'))
    const upload=await cloudinary.uploader.upload(destination,{public_id:`jacketee/batch-1/${p.slug}/${view}`,overwrite:false,resource_type:'image',timeout:120000})
    const response=await fetch(upload.secure_url)
    assert.ok(response.ok)
    const remote=await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    assert.ok(remote.xmp?.toString().includes('trainedAlgorithmicMedia'),'Hosted image missing AI metadata')
    const image={url:upload.secure_url,alt:`${p.name}, ${job.view} view`,order:job.order}
    const images=[...(p.images||[]).filter(i=>i.order!==job.order),image].sort((a,b)=>a.order-b.order)
    const result=await products.updateOne({_id:p._id,isDraft:true,status:'inactive',images:p.images},{$set:{images,updatedAt:new Date()}})
    assert.equal(result.matchedCount,1,'Concurrent image change')
    await fs.writeFile(receipt,JSON.stringify({...job,destination,image,metadataVerified:true},null,2))
    console.log(`Saved: ${p.slug} ${view}`)
  }
}finally{await mongoose.disconnect()}
