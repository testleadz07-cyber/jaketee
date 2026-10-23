import 'dotenv/config'
import fs from 'node:fs/promises'
import mongoose from 'mongoose'

// Deliberately read-only: this command has no database update path.
const out = 'docs/product-content-review'
const normalize = s => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
function strings(value, prefix = '') {
  if (typeof value === 'string') return [[prefix, value]]
  if (!value || typeof value !== 'object' || value instanceof Date) return []
  return Object.entries(value).flatMap(([key, item]) => strings(item, prefix ? `${prefix}.${key}` : key))
}
await fs.mkdir(out, { recursive: true })
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
  const products = await mongoose.connection.db.collection('products').find({}).sort({ _id: 1 }).toArray()
  const sentences = new Map()
  const flags = []
  for (const p of products) {
    const matches = strings(p).filter(([, text]) => /premium varsity and letterman jacket available|fully customizable with patches,? and colors|puffer jackets|designed\s+in\s+usa/i.test(text))
    if (matches.length) flags.push({ id: String(p._id), name: p.name, slug: p.slug, matches: matches.map(([field, text]) => ({ field, text })) })
    for (const field of ['description', 'productDetailsIntro', 'specificationDetails', 'careInstructions', 'materials']) {
      for (const sentence of String(p[field] || '').split(/(?<=[.!?])\s+|\n+/).map(normalize).filter(s => s.length >= 30)) {
        const key = sentence.toLowerCase()
        if (!sentences.has(key)) sentences.set(key, { sentence, products: new Map() })
        const group = sentences.get(key)
        if (!group.products.has(String(p._id))) group.products.set(String(p._id), { id: String(p._id), slug: p.slug, fields: [] })
        group.products.get(String(p._id)).fields.push(field)
      }
    }
  }
  const duplicates = [...sentences.values()].filter(g => g.products.size > 1).map(g => ({ sentence: g.sentence, count: g.products.size, products: [...g.products.values()] })).sort((a,b) => b.count-a.count)
  const origin = products.filter(p => strings(p).some(([,s]) => /designed\s+in\s+usa/i.test(s)))
  const report = { generatedAt: new Date().toISOString(), mode: 'read-only', productCount: products.length, flaggedProductCount: flags.length, originProductCount: origin.length, duplicates, flags }
  await fs.writeFile(`${out}/dry-run.json`, JSON.stringify(report, null, 2)+'\n')
  const sourceFields = ['name','slug','description','productDetailsIntro','materials','specifications','specificationDetails','careInstructions','decoration','sizes','variants','embroidery','sizingFitDetails']
  const batch = products.slice(0,10).map(p => ({ id: String(p._id), sourceUpdatedAt: p.updatedAt, source: Object.fromEntries(sourceFields.filter(k => p[k] !== undefined).map(k => [k,p[k]])), review: { status: 'pending', reviewer: '', reviewedAt: '', notes: '' } }))
  // Preserve editorial drafts and review decisions when re-running the audit.
  try { await fs.writeFile(`${out}/batch-01-source.json`, JSON.stringify(batch,null,2)+'\n', {flag:'wx'}) } catch(e) { if(e.code !== 'EEXIST') throw e }
  await fs.writeFile(`${out}/dry-run.md`, `# Product copy dry run\n\nRead-only MongoDB products audit. No writes or publishing.\n\nProducts: ${products.length}. Flagged products: ${flags.length}. Products with obsolete origin wording: ${origin.length}.\n\n## Repeated sentences\n\n${duplicates.map(g=>`- ${g.count} products: ${g.sentence}`).join('\n')}\n\nSee dry-run.json for product IDs, slugs, affected fields and original text. First review batch: batch-01-source.json (10 products).\n`)
  console.log(JSON.stringify({productCount:products.length,flagged:flags.length,obsoleteOrigin:origin.length,duplicateSentences:duplicates.length,out}))
} finally { await mongoose.disconnect() }
