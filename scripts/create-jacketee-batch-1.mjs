import 'dotenv/config'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

// Source is the owner's supplied prompt, retained verbatim for SEO fields.
const sourcePath = process.argv.find(arg => arg.startsWith('--source='))?.slice(9)
assert.ok(sourcePath, 'Supply --source=<owner prompt text file>')
const source = await fs.readFile(sourcePath, 'utf8')
const sections = [...source.matchAll(/^> \*\*(\d+)\. (.*?)\*\*\r?\n([\s\S]*?)(?=^> \*\*\d+\. |^> ---)/gm)]
assert.equal(sections.length, 11)
const sizes = ['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL']
const palettes = [['brown','beige'],['red','black'],['red','white'],['black','yellow'],['burgundy','cream'],['royal blue','white'],['black','gold'],['white','red'],['black','black'],['black','cream'],['navy','gold']]
const openings = [
  'A brown varsity jacket brings warm, understated color to everyday outfits. Students and casual wearers can pair its brown body and beige sleeves with denim or simple layers for a classic campus look.',
  'This red and black letterman jacket suits students and teams looking for a strong two-tone look. The red body and black sleeves give group outfits a clear color combination while leaving space for individual details.',
  'A red and white letterman jacket gives students and teams a bright, traditional look. Its red body and contrasting white sleeves provide a clean starting point for personal lettering and coordinated group outfits.',
  'This black and yellow varsity jacket suits students, teams and everyday wearers who enjoy bold contrast. A black body keeps the look grounded while yellow sleeves bring the brighter color into focus.',
  'A burgundy varsity jacket suits everyday wearers who like deeper colors and a classic silhouette. Cream sleeves soften the burgundy body for an understated look that works with denim and simple casual layers.',
  'This royal blue letterman jacket suits students, teams and graduating groups seeking a crisp two-tone look. Its royal blue body and white sleeves give each wearer room to add personal details within a coordinated outfit.',
  'A senior letterman jacket marks a graduating year with a personal detail chosen by the wearer. This black and gold style suits senior groups and individual students, with one chenille graduation year patch included in your chosen year.',
  'This cheer letterman jacket suits cheerleaders and squads seeking a bright, coordinated layer. The white wool body and red sleeves frame one included chenille megaphone patch for a cheer-focused look.',
  'A cheer varsity jacket in black satin suits squads and individual cheerleaders looking for a lightweight shell with a clean finish. Pink and black trim adds contrast while the black body and sleeves keep the main color consistent.',
  'For shoppers searching for oversized varsity jacket women styles, this black and cream option offers relaxed proportions for everyday wear. Dropped shoulders and a longer body define the silhouette, and our factory has confirmed the oversized pattern.',
  'A vintage letterman jacket brings a retro-inspired look to everyday outfits. This navy and gold version suits wearers who prefer a leather shirt collar, with matching cuffs and waistband completing the classic color combination.'
]
const keywordCopy = [
  'Choose this brown letterman jacket for its warm palette. The brown and beige varsity jacket gives personal lettering a coordinated backdrop.',
  'Choose this red and black varsity jacket for coordinated outfits. For a letterman jacket red with black sleeves, the contrasting panels keep your chosen colors distinct.',
  'Wear this red and white varsity jacket for group events or everyday outings.',
  'Personalize this black and yellow letterman jacket for your group. If you want a varsity jacket black and yellow in color, review your lettering layout in the proof.',
  'Choose this burgundy letterman jacket for a classic color combination. For shoppers considering a maroon and cream varsity jacket, review the burgundy shade before approving your design.',
  'Personalize this royal blue varsity jacket for individual or group wear. The blue and white letterman jacket provides a clear backdrop for your chosen details.',
  'Make this senior varsity jacket your own. A class of 2027 letterman jacket is one option; your black and gold letterman jacket can carry any graduation year you choose.',
  'Personalize your cheerleader letterman jacket with squad details. For a cheer letterman jacket custom layout, choose your cheer letterman jacket patches and review their placement in the proof.',
  'Personalize this cheerleader varsity jacket for individual or squad wear. Bring your cheer varsity jacket ideas to the digital proof before approving the final layout.',
  'Explore oversized letterman jacket women styling with personal patches and back lettering.',
  'Choose this vintage varsity jacket for its shirt-collar silhouette. For a letterman jacket with collar detail, this retro letterman jacket offers a distinct alternative within the collection.'
]
const products = sections.map((match, index) => {
  const [, number, name, block] = match
  const n = Number(number)
  const slug = block.match(/Slug: `([^`]+)`/)[1]
  const category = block.match(/Category: ([\w/-]+)/)[1].split('/').at(-1)
  const primaryKeyword = block.match(/Primary keyword: \*\*([^*]+)\*\*/)[1]
  const secondaryKeywords = block.match(/Secondary: ([^\r\n]+)/)[1].trim().split(', ')
  const seoTitle = block.match(/SEO title: ([^\r\n]+)/)[1].trim()
  const seoDescription = block.match(/Meta: ([^\r\n]+)/)[1].trim()
  const [body,sleeves] = palettes[index]
  const satin = n === 9
  const fit = n === 10 ? 'Oversized fit with dropped shoulders and a longer body' : 'True-to-size fit; compare your measurements with the size guide'
  const trim = satin ? 'pink and black' : `${body} and ${sleeves}`
  const details = [satin ? 'Body and sleeves: black 100% polyester satin shell' : `Body: ${body} 24 oz melton wool`, ...(!satin ? [`Sleeves: ${sleeves} genuine cowhide leather`] : []), n === 11 ? 'Collar: leather shirt collar; navy and gold knit cuffs and waistband' : `Trim: ${trim} striped knit collar, cuffs and waistband`, 'Lining: quilted lining', 'Closure: snap-button front', 'Pockets: two welt pockets', `Fit: ${fit}`, 'Sizes: XXS through 6XL']
  const keywordLine = keywordCopy[index]
  const description = `${openings[index]}\n\nDetails\n${details.map(d=>`- ${d}`).join('\n')}\n\nCustomization options\n- Chenille letter and name embroidery\n- Number, patches and back lettering\n- Free digital design proof before production.\n\n${keywordLine} Choose your layout through our [custom letterman jacket](/custom-letterman-jackets) options and review the placement before production.\n\nProduction and delivery\nMade in our Sialkot factory. Made in 6–7 business days after design approval. Delivery in 5–7 business days.`
  const careInstructions = satin ? 'Gentle wash the satin jacket in cold water with mild detergent. Protect embroidery and patches; avoid bleach, wringing and tumble drying. Air dry and avoid direct heat.' : 'Spot clean the wool body with a damp cloth and mild cleaner. Condition genuine leather sleeves with a suitable leather conditioner, testing a hidden area first. Do not machine wash, soak or tumble dry. Use a cleaner experienced with mixed wool and leather garments when needed.'
  const custom = `Personalize your ${body} ${satin ? 'satin' : 'wool'} jacket with a chenille letter, embroidered name, number, patches and back lettering. ${n===7 ? 'One chenille graduation year patch is included; choose your year. ' : n===8 ? 'One chenille megaphone patch is included. ' : ''}You receive a free digital design proof before production.`
  const faqs = [
    {question:`How does the ${name} fit?`,answer:[`${fit}. Available in XXS through 6XL.${n===10 ? ' The oversized pattern is factory-confirmed. Request the Oversized size chart with garment measurements before selecting a size.' : ' Choose your usual size after checking chest, shoulder, sleeve and jacket length measurements.'}`]},
    {question:`What can I customize on the ${name}?`,answer:[custom]},
    {question:`How do I care for the ${name}?`,answer:[careInstructions]}
  ]
  const words = description.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').split(/\s+/).length
  assert.ok(words >= 150 && words <= 220, `${slug}: ${words} words`)
  assert.ok(description.toLowerCase().includes(primaryKeyword), slug)
  for (const keyword of secondaryKeywords) assert.equal(description.toLowerCase().split(keyword).length-1, 1, `${slug}: ${keyword}`)
  return {name,slug,category,description,seoTitle,seoDescription,price:60,currency:'USD',primaryKeyword,secondaryKeywords,landingPages:[],variants:sizes.map(value=>({name:'Size',value,priceAdjust:0,inStock:true})),careInstructions,specificationDetails:details.join('\n'),...(n===10 ? {sizeChart:{name:'Oversized',patternConfirmed:true,measurementStatus:'Factory garment measurements pending'}} : {}),faqs,isDraft:true,status:'inactive',images:[],tags:[],isFeatured:false,inStock:true,averageRating:0,reviewCount:0,sourceBatch:'jacketee-batch-1'}
})

await fs.mkdir('docs/jacketee-batch-1',{recursive:true})
await fs.writeFile('docs/jacketee-batch-1/review.md', '# Jacketee batch 1 — draft review\n\nUSD 60 each. Sizes XXS–6XL. No landing-page assignments. Factory confirmed oversized construction; actual oversized garment measurements still need to be supplied, not invented. Human approval required before activation.\n\n' + products.map(p=>`## ${p.name}\n\nSlug: ${p.slug}\n\nSEO title: ${p.seoTitle}\n\nMeta: ${p.seoDescription}\n\n${p.description}\n\nCare: ${p.careInstructions}\n\n${p.faqs.map(f=>`### ${f.question}\n\n${f.answer.join(' ')}`).join('\n\n')}`).join('\n\n'))
console.log(`Validated ${products.length} products, ${products.length*3} FAQs; review saved.`)
if (process.argv.includes('--apply')) {
  try {
    await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
    const db = mongoose.connection.db
    const categories = await db.collection('categories').find({slug:{$in:['varsity-jackets','wool-leather','satin','retro']}}).toArray()
    const parent = categories.find(c=>c.slug==='varsity-jackets')
    assert.ok(parent)
    for(const p of products) assert.ok(categories.find(c=>c.slug===p.category && String(c.parentId)===String(parent._id)), `Missing category ${p.category}`)
    for(const p of products) {
      const existing = await db.collection('products').findOne({slug:p.slug})
      if(existing && existing.sourceBatch!=='jacketee-batch-1') console.log('Existing product:', existing.slug, 'status:',existing.status,'draft:',existing.isDraft)
      assert.ok(!existing || existing.sourceBatch==='jacketee-batch-1' || (existing.isDraft && existing.status==='inactive'), `Existing active product: ${p.slug}; refusing to replace`)
    }
    for(const p of products) {
      const {category,faqs,...fields}=p
      const now=new Date()
      const categoryId=categories.find(c=>c.slug===category)._id
      const existing = await db.collection('products').findOne({slug:p.slug})
      if(existing) {
        await fs.writeFile(`docs/jacketee-batch-1/${p.slug}-before.ejson`,mongoose.mongo.BSON.EJSON.stringify(existing,null,2),{flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error})
        const {images,...updates}=fields
        const result = await db.collection('products').updateOne({_id:existing._id,isDraft:true,status:'inactive',updatedAt:existing.updatedAt},{$set:{...updates,categoryId,updatedAt:now}})
        assert.equal(result.matchedCount,1, `Concurrent change: ${p.slug}`)
      } else await db.collection('products').insertOne({...fields,categoryId,createdAt:now,updatedAt:now})
      for(const [order,faq] of faqs.entries()) await db.collection('faqs').updateOne({sourceBatch:'jacketee-batch-1',question:faq.question},{$setOnInsert:{...faq,category:'Varsity Jackets',sourceBatch:'jacketee-batch-1',status:'draft',displayPages:[p.slug],order,bullets:[],ordered:[],mergedQuestions:[],createdAt:now,updatedAt:now}},{upsert:true})
    }
    const saved = await db.collection('products').find({slug:{$in:products.map(p=>p.slug)}}).toArray()
    assert.equal(saved.length,11)
    for(const p of saved){assert.equal(p.price,60);assert.equal(p.isDraft,true);assert.equal(p.status,'inactive');assert.deepEqual(p.landingPages,[]);assert.deepEqual(p.variants.map(v=>v.value),sizes)}
    assert.equal(await db.collection('faqs').countDocuments({sourceBatch:'jacketee-batch-1',status:'draft'}),33)
    console.log('Verified 11 inactive draft products and 33 draft FAQs in MongoDB.')
  } finally { await mongoose.disconnect() }
}


