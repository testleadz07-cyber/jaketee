import fs from 'node:fs/promises'
import sharp from 'sharp'
const root='output/jacketee-batch-1'
const jobs=JSON.parse(await fs.readFile(`${root}/image-sources.json`,'utf8'))
const slugs=[...new Set(jobs.map(j=>j.slug))]
await fs.mkdir(`${root}/review`,{recursive:true})
for(let start=0;start<slugs.length;start+=4){
  const group=slugs.slice(start,start+4)
  const layers=[]
  for(const [row,slug] of group.entries())for(const job of jobs.filter(j=>j.slug===slug)){
    layers.push({input:await sharp(job.source).resize(300,300,{fit:'contain',background:'#eeeeee'}).toBuffer(),left:job.order*300,top:row*330})
    layers.push({input:Buffer.from(`<svg width="300" height="30"><rect width="300" height="30" fill="white"/><text x="6" y="20" font-size="14">Product ${start+row+1}: ${job.view}</text></svg>`),left:job.order*300,top:row*330+300})
  }
  const destination=`${root}/review/products-${start+1}-${start+group.length}.jpg`
  await sharp({create:{width:1200,height:group.length*330,channels:3,background:'white'}}).composite(layers).jpeg({quality:90}).toFile(destination)
  console.log(destination)
}
