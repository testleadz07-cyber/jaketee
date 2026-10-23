import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
const root=path.resolve('output/color-drafts'),plans=JSON.parse(await fs.readFile(path.join(root,'draft-plan.json'),'utf8'))
const views=['front','back','left-sleeve','right-sleeve']
await fs.mkdir(path.join(root,'review'),{recursive:true})
for(let group=0;group<8;group++){
 if(process.argv[2]&&plans[group*5].group!==process.argv[2])continue
 const tiles=[]
 for(let row=0;row<5;row++)for(let col=0;col<4;col++){
  const plan=plans[group*5+row]
  let file=path.join(root,'images',plan.product.slug,`${views[col]}.jpg`)
  try{file=JSON.parse(await fs.readFile(path.join(root,'images',plan.product.slug,`${col}.json`),'utf8')).destination}catch{}
  let input
  try{input=await sharp(file).resize(250,250,{fit:'contain',background:'#eee'}).toBuffer()}
  catch{input=await sharp({create:{width:250,height:250,channels:3,background:'#ddd'}}).png().toBuffer()}
  tiles.push({input,left:col*250,top:row*280})
  const label=Buffer.from(`<svg width="250" height="30"><rect width="250" height="30" fill="white"/><text x="8" y="20" font-size="14">${group*5+row+1}: ${views[col]}</text></svg>`)
  tiles.push({input:label,left:col*250,top:row*280+250})
 }
 const out=path.join(root,'review',`${plans[group*5].group}.jpg`)
 await sharp({create:{width:1000,height:1400,channels:3,background:'white'}}).composite(tiles).jpeg({quality:90}).toFile(out)
 console.log(out)
}
