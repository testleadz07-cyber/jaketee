import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const dir='docs/product-care'
const {products,categories,capturedAt}=JSON.parse(await fs.readFile(`${dir}/source.json`,'utf8'))
const library=JSON.parse(await fs.readFile('content/care-blocks.json','utf8'))
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const closing='For custom orders, follow any care label sewn inside your jacket.'
const blockHTML=b=>`<section><h3>${escape(b.heading)}</h3><p>${escape(b.paragraph)}</p><ul>${b.do.map(s=>`<li><strong>Do:</strong> ${escape(s)}</li>`).join('')}${b.avoid.map(s=>`<li><strong>Avoid:</strong> ${escape(s)}</li>`).join('')}</ul></section>`
const byId=new Map(library.map(b=>[b.id,b]))
const identify=text=>{
 const s=String(text||'').toLowerCase()
 if(/\bor\b|\bchoose\b/.test(s)) return null
 if(/suede/.test(s)) return 'suede'
 if(/faux (?:leather)|\bpu\b|vegan leather|vinyl/.test(s)) return 'faux-pu-leather'
 if(/shearling/.test(s)) return null
 if(/sheep(?:skin)?|lambskin/.test(s)) return 'sheep-lambskin'
 if(/cowhide/.test(s)) return 'cowhide-leather'
 if(/melton|\bwool\b/.test(s)) return 'melton-polyester'
 if(/polyester satin/.test(s)) return 'polyester-satin'
 if(/nylon/.test(s)) return 'nylon'
 if(/soft[ -]?shell/.test(s)) return 'soft-shell'
 if(/fleece/.test(s)) return 'cotton-polyester-fleece'
 if(/denim/.test(s)) return 'denim'
 if(/cotton twill/.test(s)) return 'cotton-twill'
 return null
}
function parseFields(p){
 const entries=[]
 const spec=p.specificationDetails || ''
 const raw=(spec+'\n'+(typeof p.specifications==='object'?Object.entries(p.specifications||{}).map(([k,v])=>`${k}: ${v}`).join('\n'):p.specifications||'')+'\n'+(!spec&&!/or style-specific fabric/i.test(p.materials||'')?p.materials||'':''))
 const explicitDescription=(p.description||'').split(/\n+/).filter(line=>/^[?\s-]*(?:body|shell|sleeves?|lining|fill|leather)\s*:/i.test(line)).join('\n')
 const lines=(raw+'\n'+explicitDescription).split(/\n+/).map(s=>s.replace(/^[•\s-]+/,'').trim()).filter(Boolean)
 for(let i=0;i<lines.length;i++){
  let key,value
  const colon=lines[i].indexOf(':')
  if(colon>=0){key=lines[i].slice(0,colon);value=lines[i].slice(colon+1).trim()}
  else if(/^(body|sleeves?|inside lining|lining|shell|fill)$/i.test(lines[i])){key=lines[i];value=lines[++i]||''}
  else continue
  entries.push({key:key.toLowerCase()==='leather'?'shell':key.toLowerCase(),value,evidence:lines[i]})
 }
 return entries
}
function urlFor(p){
 const chain=[],visited=new Set();let c=categories.find(c=>c._id===p.categoryId)
 while(c&&!visited.has(c._id)){visited.add(c._id);chain.unshift(c.slug==='wool'?'all-wool':c.slug);c=categories.find(parent=>parent._id===c.parentId)}
 return 'https://www.jacketee.com/'+[...(chain.length?chain:['products']),p.slug].join('/')
}
const rows=products.map(p=>{
 const fields=parseFields(p), issues=[],evidence=[],assigned=[]
 const patchOnly=p.name==='Letterman Patch Packs'
 const body=fields.find(f=>/body|shell/.test(f.key))
 const sleeve=fields.find(f=>/sleeve/.test(f.key)&&!/body|shell/.test(f.key)) || (/cotton twill sleeves/i.test(p.name)?{key:'sleeves',value:'Cotton Twill',evidence:p.name}:null)
 const lining=fields.find(f=>/lining/.test(f.key))
 const fill=fields.find(f=>/fill|insulat/.test(f.key)&&!/lining/.test(f.key))
 const add=(role,id,source)=>{if(id){assigned.push({role,id});evidence.push({role,source})}}
 if(!patchOnly){
  const bodyId=identify(body?.value || p.name)
  add('body',bodyId,body?`${body.key}: ${body.value}`:`Title: ${p.name}`)
  if(!bodyId) issues.push(`Body material needs confirmation${body?`: ${body.value}`:''}.`)
  const sleeveId=identify(sleeve?.value)
  if(sleeve){if(sleeveId)add('sleeves',sleeveId,`${sleeve.key}: ${sleeve.value}`);else issues.push(`Sleeve material needs confirmation: ${sleeve.value}.`)}
  else if(!body || !/sleeve/.test(body.key)){
   if(!/\bvest\b/i.test(p.name)) issues.push('Sleeve composition is not explicitly recorded with the body material.')
  }
  const fillText=[fill?.value,lining?.value].filter(Boolean).join(' ')
  if(/dacron|down|synthetic|polyester (?:fill|padding)/i.test(fillText)) add('fill','fill',fillText)
  else if(/puffer|padded|fill|insulat/i.test(p.name+' '+p.description+' '+fillText)) issues.push('Confirm fill type and construction; puffer or padded does not identify down versus synthetic fill.')
  add('lining','self-fabric-lining','Store owner, 2026-10-21: lining uses the body fabric for all products.')
  if(lining && bodyId && identify(lining.value)!==bodyId) issues.push(`Owner confirms self-fabric lining, but existing record says ${lining.value}. Resolve the specification conflict before publishing.`)
  if(/cowhide/i.test([body?.value,sleeve?.value].filter(Boolean).join(' '))) issues.push('Existing cowhide specification conflicts with owner statement that leather options are sheep or faux. Confirm the applicable option before publishing.')
  if(/shearling|faux fur|pearl|rhinestone|\bfringe\b|felt lettering|dtf|screen print|tackle twill|applique/i.test(p.name+' '+(lining?.value||''))) issues.push('Additional trim, decoration or lining needs care guidance outside this 14-block library.')
  // A customization menu or available=true is not evidence that a finished jacket has decoration.
  const fixedName=/embroidered|embroidery|chenille|with name|name and initial|applique letters/i.test(p.name)
  if(fixedName) add('decoration','decoration',`Decoration included in title: ${p.name}`)
 }else add('decoration','decoration','Title and description specify chenille patches with embroidered detail.')
 const unique=[...new Set(assigned.map(a=>a.id))]
 const status=issues.length?'NEEDS REVIEW':'DRAFT FOR HUMAN REVIEW'
 const knownHTML=unique.map(id=>blockHTML(byId.get(id))).join('')+`<p>${closing}</p>`
 const fullCareHTML=issues.length?`<p><strong>NEEDS REVIEW</strong></p><p>${escape(issues.join(' '))}</p><p>${closing}</p>`:knownHTML
 return {productUrl:urlFor(p),productName:p.name,productId:p._id,status,blocksUsed:unique.map(id=>byId.get(id).heading),blockIds:unique,assignments:assigned,evidence,reviewReasons:issues,fullCareHTML,knownMaterialPreviewHTML:issues.length?knownHTML:undefined,notes:'Decoration availability is not proof of attachment. Add the decoration block only to a confirmed decorated configuration.'}
})
assert.equal(library.length,17)
for(const b of library){assert.equal(b.do.length,2);assert.equal(b.avoid.length,2);const n=b.paragraph.match(/[.!?](?:\s|$)/g)?.length;assert.ok(n>=3&&n<=5,`${b.id}: sentences ${n}`);assert.ok(!/[\u2014]/.test(JSON.stringify(b)))}
for(const r of rows){assert.ok(r.fullCareHTML.endsWith(`<p>${closing}</p>`));assert.equal(new Set(r.blockIds).size,r.blockIds.length);if(r.status==='DRAFT FOR HUMAN REVIEW')assert.ok(r.blockIds.includes('self-fabric-lining')||r.productName==='Letterman Patch Packs')}
await fs.writeFile(`${dir}/product-care.json`,JSON.stringify({sourceCapturedAt:capturedAt,publication:'Not published; review in batches of 10',rows},null,2)+'\n')
const counts={products:rows.length,completeDrafts:rows.filter(r=>r.status==='DRAFT FOR HUMAN REVIEW').length,needsReview:rows.filter(r=>r.status==='NEEDS REVIEW').length}
const intro=`# Jacketee product care table\n\n${counts.products} products: ${counts.completeDrafts} complete material-based drafts; ${counts.needsReview} NEEDS REVIEW. No database writes. Review ten products at a time before publishing.\n\nCare blocks are original editorial wording. Owner confirmations dated 2026-10-21 are recorded in owner-confirmations.json; competitor materials are not used as Jacketee specifications. Identical block IDs use identical wording. Shell advice never overrides more delicate sleeves, lining, fill or attached decoration. The latest owner instruction assigns a self-fabric lining block to every garment; conflicting existing lining and cowhide specifications remain review holds. The fill block covers recorded Dacron padding separately from the lining. Available customization does not prove decoration is attached. Fiber percentages, unknown shell materials and unresolved leather choices are not inferred.\n\nFor NEEDS REVIEW rows, Full Care Text is a hold notice, not paste-ready care advice. Confirm the missing data first. Known-material previews and evidence are provided in product-care.json. Complete drafts have paste-ready HTML, subject to human review and the sewn care label.\n\n`
const cell=s=>String(s).replaceAll('|','&#124;').replaceAll('\n',' ')
await fs.writeFile(`${dir}/product-care-table.md`,intro+'| Product URL | Product Name | Blocks Used | Full Care Text (HTML) |\n| --- | --- | --- | --- |\n'+rows.map(r=>`| ${r.productUrl} | ${cell(r.productName)} | ${r.status}: ${cell(r.blocksUsed.join(' > ')||'None confirmed')} | ${cell(r.fullCareHTML.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'))} |`).join('\n')+'\n')
await fs.writeFile(`${dir}/care-block-library.md`,'# Jacketee care block library\n\nFourteen original blocks plus three blocks for owner-confirmed blends and self-fabric lining. Use only for confirmed materials. Follow the complete garment label and the most delicate component.\n\n'+library.map(b=>`## ${b.heading}\n\n${b.paragraph}\n\n${b.do.map(s=>`- **Do:** ${s}`).join('\n')}\n${b.avoid.map(s=>`- **Avoid:** ${s}`).join('\n')}\n`).join('\n'))
await fs.writeFile(`${dir}/care-block-library.html`,'<!doctype html><meta charset="utf-8"><title>Jacketee care block library</title>'+library.map(blockHTML).join('\n'))
const table=rows.map(r=>`<tr data-status="${r.status}"><td><a href="${escape(r.productUrl)}">${escape(r.productUrl)}</a></td><td>${escape(r.productName)}</td><td><strong>${r.status}</strong><p>${escape(r.blocksUsed.join(' > ')||'None confirmed')}</p></td><td>${r.status==='NEEDS REVIEW'?`<p class="review">${escape(r.reviewReasons.join(' '))}</p>`:''}<details><summary>Preview care text</summary>${r.fullCareHTML}</details><textarea aria-label="Care HTML for ${escape(r.productName)}" readonly>${escape(r.fullCareHTML)}</textarea></td></tr>`).join('\n')
await fs.writeFile(`${dir}/product-care-table.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Jacketee product care review</title><style>body{font:15px/1.5 system-ui;margin:24px;color:#182230}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:14px;vertical-align:top;text-align:left}th{background:#e8eef4;position:sticky;top:0}td:first-child{max-width:220px;overflow-wrap:anywhere}td:nth-child(2){min-width:170px}td:last-child{width:48%}textarea{box-sizing:border-box;width:100%;min-height:160px;margin-top:12px}summary{cursor:pointer;font-weight:600}.review{color:#9a3412}section{border-top:1px solid #cbd5e1;margin-top:16px}tr[data-status="NEEDS REVIEW"]{background:#fffaf3}h1{font-size:26px}</style></head><body><h1>Jacketee product care review</h1><p>${counts.products} products. ${counts.completeDrafts} complete drafts. ${counts.needsReview} NEEDS REVIEW. Not published. Review in batches of 10.</p><p>Owner-confirmed blends and self-fabric lining are used. Conflicting existing specifications remain flagged. Optional customization is not treated as attached decoration. NEEDS REVIEW rows contain hold notices and must not be published as care instructions.</p><table><thead><tr><th>Product URL</th><th>Product Name</th><th>Blocks Used</th><th>Full Care Text (HTML, ready to paste after review)</th></tr></thead><tbody>${table}</tbody></table></body></html>`)
await fs.writeFile(`${dir}/summary.json`,JSON.stringify(counts,null,2)+'\n')
console.log(JSON.stringify(counts));
