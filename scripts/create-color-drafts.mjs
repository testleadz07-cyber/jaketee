import 'dotenv/config'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

const dir='output/color-drafts'
const catalog=JSON.parse(await fs.readFile(`${dir}/catalog-reference.json`,'utf8'))
const source=await fs.readFile('C:/Users/arehman/.codex/attachments/db96e0ea-75b3-4073-ba14-1763ac51baf9/Pasted text.txt','utf8')
const titles=[...source.split('## Prompt for')[0].matchAll(/^\d+\. (.+)$/gm)].map(m=>m[1].trim())
assert.equal(titles.length,40)
const colors=[['Black','Cream'],['Red','White'],['Forest Green','Cream'],['Navy','Grey'],['Brown','Beige'],['Maroon','Cream'],['Navy','Gold'],['Forest Green','Tan'],['Brown','Off-White'],['Burgundy','Cream'],['Black','Gold'],['Navy','White'],['Royal Blue','White'],['Red','White'],['Maroon','Gold'],['Pink','White'],['Navy','Grey'],['Lavender','White'],['Black','Gold'],['Light Blue','White'],['Red','White'],['Black','Pink'],['Royal Blue','Gold'],['Purple','White'],['Teal','Black'],['Red','White'],['Red','Black'],['Black','Yellow'],['Green','White'],['Royal Blue','Grey'],['Black','Grey'],['Navy','White'],['Charcoal','Orange'],['Royal Blue','White'],['Black','Red'],['Black','Cream'],['Olive','Black'],['Grey','White'],['Navy','Tan'],['Burgundy','Cream']]
const groups=['oversized','vintage','senior-class','sorority-fraternity','cheer','schools','corporate','private-label']
const contexts=[
 ['A roomy black body and cream sleeves give this women’s design a clear two-tone outline.','Red and white panels frame an oversized men’s silhouette with space for layering.','Forest green and cream create a coordinated oversized starting point for a personal design.','Navy and grey keep this unisex oversized design easy to coordinate with everyday layers.','Brown and beige give the roomy wool design a softer, earth-tone direction.'],
 ['Maroon wool and cream leather sleeves set a traditional letterman direction.','Navy and gold combine with a shirt collar for a distinct retro silhouette.','Forest green and tan offer a vintage-inspired palette for a men’s varsity design.','Brown and off-white contrast across a newly made, heritage-inspired letterman shape.','Burgundy and cream bring a classic two-tone treatment to this women’s varsity design.'],
 ['Black and gold frame a customizable graduation-year patch.','Navy and white provide a coordinated base for a senior class design.','Royal blue and white make individual class details easy to distinguish.','Red and white set off the sample name placement on this senior letterman design.','Maroon and gold pair with a chenille initial for a class-focused varsity design.'],
 ['Pink and white satin provide a light-catching base for custom lettering.','Navy and grey keep a group varsity design visually consistent across different sizes.','Lavender and white offer a coordinated palette for a custom sorority-inspired design.','Black and gold create a defined two-tone fraternity-inspired letterman design.','Light blue and white frame the sample embroidery on this coordinated group design.'],
 ['Red and white accompany a generic megaphone patch for a cheer-focused design.','Black and pink create a contrast-led varsity design for cheer personalization.','Royal blue and gold provide a coordinated letterman palette for a cheer group.','Purple and white carry through a girls’ varsity silhouette planned around youth measurements.','Teal and black define a youth letterman design with room for individual cheer details.'],
 ['Red and white form a traditional custom letterman starting point.','Red wool and black leather sleeves define this custom letterman design.','Black and yellow provide a clear contrast for optional varsity personalization.','Green and white offer a coordinated letterman palette for individual or group details.','Royal blue and grey bring a balanced two-tone direction to a custom varsity design.'],
 ['Black and grey panels give sample chest embroidery a clear placement on this coach design.','Navy and white combine in a bomber design with sample company-logo embroidery placement.','Charcoal and orange panels frame sample chest embroidery on this softshell design.','Royal blue and white support generic TEAM lettering on a coordinated varsity design.','Black and red panels carry sample embroidery placement across a quilted puffer design.'],
 ['Black and cream form a varsity starting design for a private-label collection.','Olive and black create a two-tone bomber starting point for a private-label project.','Grey and white combine in a full-zip fleece hoodie starting design.','Navy and tan panels define a coach-jacket starting point for private-label development.','Burgundy and cream give a private-label varsity concept a classic two-tone outline.']
]
const careFor=kind=>kind==='varsity'?'Brush the melton wool gently and wipe leather sleeves with a soft dry cloth. Use a specialist experienced in wool and leather for thorough cleaning. Do not machine wash, soak, tumble dry or apply direct heat. Follow the final sewn-in care label.':kind==='hoodie'?'Follow the final sewn-in care label. If washing is permitted, turn inside out, wash gently in cool water with mild detergent and reshape to air dry. Do not bleach, tumble dry or iron directly over embroidery or patches.':`Follow the final sewn-in care label. Blot marks with a soft cloth and protect embroidery from rubbing. Wash only if the complete garment label permits it, using cool water and a mild cleaner. Do not bleach, wring or apply direct heat; seek specialist advice for deep cleaning${kind==='puffer'?' and padded construction':''}.`
const plans=titles.map((name,i)=>{
 const [bodyColor,sleeveColor]=colors[i],group=groups[Math.floor(i/5)]
 let kind='varsity',category='wool-leather',body='melton wool',sleeves='cowhide leather',reference='Black Wool and Yellow Leather Sleeves Letterman Jacket'
 if(i===15||i===19){kind='satin';category='satin';body=sleeves='polyester satin';reference='Stylish Satin Varsity Jacket with Piping'}
 if(i===30||i===38){kind='coach';category='coach-jackets';body=sleeves='nylon twill';reference='Coach Jacket Red Nylon Twill'}
 if(i===31||i===36){kind='bomber';category='bomber-jackets';body=sleeves='nylon twill';reference='Nylon Bomber Jacket in Royal Blue'}
 if(i===32){kind='softshell';category='bomber-jackets';body=sleeves='softshell';reference='Royal Blue Soft-Shell Bomber Jacket'}
 if(i===34){kind='puffer';category='puffer-jackets';body=sleeves='nylon twill';reference='Navy Blue Puffer Jacket'}
 if(i===37){kind='hoodie';category='fleece-hoodies';body=sleeves='cotton fleece';reference='Team Logo Embroidered Zip-Up Hoodie'}
 const ref=catalog.products.find(p=>p.name===reference),cat=catalog.categories.find(c=>c.slug===category)
 assert.ok(ref&&cat)
 const fit=i<5?'oversized':i===23||i===24?'youth regular':/for Women/.test(name)?'women’s regular':/for Men/.test(name)?'men’s regular':'unisex regular'
 const collar=i===6||kind==='coach'?'shirt collar':kind==='hoodie'?'attached hood':kind==='puffer'||kind==='softshell'?'stand collar':'ribbed stand collar'
 const closure=['bomber','softshell','puffer','hoodie'].includes(kind)?'front zipper':'front snaps'
 const rib=['varsity','satin','bomber','hoodie'].includes(kind)
 const trim=rib?`${bodyColor.toLowerCase()} with ${sleeveColor.toLowerCase()} stripes`:`${bodyColor.toLowerCase()} cuffs and hem; no rib stripes`
 const lining=kind==='hoodie'?'unlined cotton fleece interior':'lining specification to be confirmed before production'
 let decoration='blank chest and sleeves'
 if(i===10)decoration='a generic sleeve year patch reading 2027; chest blank'
 if(i===13)decoration='small chest sample name embroidery reading J'
 if(i===14||i===15||i===16||i===17)decoration='one generic chenille J on the left chest'
 if(i===19)decoration='small embroidered J on the left chest'
 if(i===20)decoration='one plain generic megaphone patch without text on the left chest'
 if(i>=30&&i<=34)decoration='small generic TEAM embroidery on the left chest'
 const description=`${contexts[Math.floor(i/5)][i%5]} The ${bodyColor.toLowerCase()} body and ${sleeveColor.toLowerCase()} sleeves establish the proposed color placement. This is a custom design starting point; check the measurements, decoration placement and final construction before ordering. Any lettering shown is generic sample personalization.\n\nDetails\n- Body: ${bodyColor} ${body}\n- Sleeves: ${sleeveColor} ${sleeves}\n- Collar: ${collar}\n- Cuffs and waistband: ${trim}\n- Lining: ${lining}\n- Closure: ${closure}\n- Fit: ${fit}\n\nCustomization options\nDiscuss a chenille letter, name, number, year patch or embroidery for suitable areas. Placement depends on the selected construction${kind==='puffer'?' and available space between quilted channels':''}. Confirm the final artwork, size and colors before production. ${group==='private-label'?'Labels, trims and packaging require a separate specification and confirmation.':'Use your own approved personalization details when requesting a finished design.'}`
 const base=`${bodyColor} and ${sleeveColor} ${kind==='varsity'?'varsity jacket':kind==='satin'?'satin jacket':kind==='hoodie'?'fleece hoodie':`${kind} jacket`}`
 const keyword=/Letterman/.test(name)?'Letterman Jacket':kind==='hoodie'?'Zip-Up Hoodie':kind==='varsity'?'Varsity Jacket':`${kind[0].toUpperCase()+kind.slice(1)} Jacket`
 let seoTitle=`${name} | Jacketee`
 if(seoTitle.length>65)seoTitle=`${bodyColor} and ${sleeveColor} ${keyword} | Jacketee`
 let seoDescription=`Explore this ${base.toLowerCase()} design. ${body===sleeves?body:`${body} and ${sleeves}`} colors and details can be customized.`
 // Keep one complete material/color/customization sentence and a short invitation.
 const main=`${bodyColor} and ${sleeveColor} ${body===sleeves?body:`${body} and ${sleeves}`} ${kind==='hoodie'?'hoodie':'jacket'} design can be customized.`
 seoDescription=[`Plan your fit and personalization, then review the details. ${main}`,`Explore the fit, colors and personalization options for your design. ${main}`,`Explore this custom design. ${main}`].find(s=>s.length>=140&&s.length<=155)||`Choose your fit and details. ${main}`
 const invitations=['Explore this design','Review this custom design','Plan your custom design','Explore your jacket design','Review your preferred fit and design']
 const endings=['with our team.','and discuss the details with our team.','and confirm the details before production.','with our team and confirm the details before production.','and discuss fit, sizing and personalization with our team before production.']
 seoDescription=invitations.flatMap(a=>endings.map(b=>`${a} ${b} ${main}`)).find(s=>s.length>=140&&s.length<=155)
 assert.ok(seoDescription,`No suitable meta for ${name}`)
 const sizes=i===23||i===24?['Youth XS','Youth S','Youth M','Youth L','Youth XL']:['XS','S','M','L','XL','2XL','3XL']
 const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
 const faqs=[{question:`How should I choose the fit for the ${name}?`,answer:[`This design uses a ${fit} fit. Compare chest, shoulder, sleeve and finished-length measurements with a jacket that fits${i<5?' over your intended layers':''}. ${i===23||i===24?'Use youth measurements rather than adult size labels.':'Confirm the final size against the size guide before production.'}`]},{question:`Can I personalize the ${bodyColor.toLowerCase()} and ${sleeveColor.toLowerCase()} ${keyword.toLowerCase()}?`,answer:[`Yes. Discuss names, numbers, a year patch, chenille letters or embroidery on suitable panels. ${kind==='puffer'?'Keep embroidery clear of quilted channels. ':''}Any sample J or TEAM artwork is generic; confirm your own artwork and placement before production.`]},{question:`How do I care for the ${name}?`,answer:[careFor(kind)]}]
 const imagePrompts=['front','back','left sleeve','right sleeve'].map(view=>({view,prompt:`Use case: product-mockup. One square 2000x2000 studio product photograph, ${view} view only, of this exact custom draft product: ${name}. ${bodyColor} ${body} body, ${sleeveColor} ${sleeves} sleeves. ${collar}; ${rib?`rib trim ${trim}`:trim}; ${closure}; ${fit} silhouette. Decoration: ${decoration}. ${kind==='puffer'?'Horizontal quilted puffer channels. ':''}${kind==='hoodie'?'Full zip hoodie with grey hood and white sleeves. ':''}Keep the same construction and colors across views. ${view.includes('sleeve')?`Show the complete jacket from its ${view.split(' ')[0]} side, with the sleeve clearly visible.`:''} Ghost mannequin, no person, seamless light-grey background, soft even catalog lighting, garment centered fully visible. No school names, mascots, real Greek letters, crests, brand logos, watermark, or other text. Show only generic personalization specified above.`}))
 return {group,referenceProductId:ref._id,referenceProductName:ref.name,reviewIssues:['Proposed construction, lining and decoration need factory confirmation before activation',...(kind==='softshell'?['Existing softshell construction is in bomber-jackets; retained that existing category']:[]),...(kind==='puffer'?['Confirm padding composition and shell before activation']:[])],imagePrompts,faqs,product:{name,slug,description,seoTitle,seoDescription,price:ref.price,categoryId:cat._id,images:[],variants:[...sizes.map(value=>({name:'Size',value,priceAdjust:0,inStock:true})),{name:'Color',value:`${bodyColor} and ${sleeveColor}`,priceAdjust:0,inStock:true}],careInstructions:careFor(kind),isDraft:true,status:'inactive',inStock:true,isFeatured:false,averageRating:0,reviewCount:0,compareAtPriceVerified:false,tags:[]}}
})
for(const p of plans){assert.ok(p.product.seoTitle.length<=65);assert.ok(p.product.seoDescription.length>=140&&p.product.seoDescription.length<=155,`${p.product.name}: meta ${p.product.seoDescription.length}`);const words=p.product.description.split(/\s+/).length;assert.ok(words>=120&&words<=200,`${p.product.name}: words ${words}`)}
await fs.writeFile(`${dir}/draft-plan.json`,JSON.stringify(plans,null,2)+'\n')
console.log(`Validated ${plans.length} draft products; plan saved. No landing-page associations or categories created.`)
if(process.argv.includes('--apply'))try{
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
 const db=mongoose.connection.db,products=db.collection('products'),faqs=db.collection('faqs')
 const journal=[]
 for(const plan of plans){
  const existing=await products.findOne({$or:[{slug:plan.product.slug},{name:plan.product.name}]})
  if(existing){journal.push({name:plan.product.name,id:String(existing._id),action:'skipped-existing'});continue}
  assert.ok(await db.collection('categories').findOne({_id:new mongoose.Types.ObjectId(plan.product.categoryId)}))
  const now=new Date(),id=new mongoose.Types.ObjectId()
  await products.insertOne({...plan.product,_id:id,categoryId:new mongoose.Types.ObjectId(plan.product.categoryId),createdAt:now,updatedAt:now})
  await faqs.insertMany(plan.faqs.map((f,order)=>({...f,status:'draft',category:'Products',displayPages:[plan.product.slug],bullets:[],ordered:[],mergedQuestions:[],order,createdAt:now,updatedAt:now})))
  const saved=await products.findOne({_id:id})
  assert.equal(saved.status,'inactive');assert.equal(saved.isDraft,true)
  journal.push({name:plan.product.name,id:String(id),action:'inserted',price:plan.product.price})
  await fs.writeFile(`${dir}/database-journal.json`,JSON.stringify(journal,null,2))
 }
 console.log(JSON.stringify(journal,null,2))
}finally{await mongoose.disconnect()}
