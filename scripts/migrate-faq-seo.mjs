import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

const apply = process.argv.includes('--apply')
const output = path.resolve('output/seo-fixes')
fs.mkdirSync(output, { recursive: true })

const aliases = {
  'how-to-design': 'Design & Customization', 'single-jacket-orders': 'Orders',
  'bulk-team-orders': 'Bulk & Team Orders', 'jacket-sizing': 'Jacket Sizing',
  'production-delivery': 'Production & Delivery', payment: 'Payments',
  'returns-exchanges': 'Returns & Exchanges', common: 'General',
  'School & University Orders': 'Bulk & Team Orders', 'Corporate Orders': 'Bulk & Team Orders',
  'Private Label': 'Bulk & Team Orders', 'Leather Vest': 'Leather Jackets',
  'Leather Biker Jacket': 'Leather Jackets', 'Shearling Jacket': 'Leather Jackets', 'Leather Coat': 'Leather Jackets',
}
const sections = new Set(['Orders', 'Shipping', 'Returns & Exchanges', 'Payments', 'Account', 'Privacy & Security', 'Design & Customization', 'Jacket Sizing', 'Production & Delivery', 'Bulk & Team Orders', 'Varsity Jackets', 'Leather Jackets', 'Puffer Jackets', 'Bomber Jackets', 'Denim Jackets', 'Coach Jackets', 'Fleece Hoodies', 'Patches & Embroidery', 'General'])

function categoryFor(faq) {
  const current = aliases[faq.category] || faq.category
  // Preserve already assigned product topics, including questions with no product keyword.
  if (sections.has(current) && !['General', 'Design & Customization', 'Bulk & Team Orders'].includes(current)) return current
  const question = faq.question.toLowerCase()
  if (/patches|chevrons|iron-on|sew-on|year patch/.test(question)) return 'Patches & Embroidery'
  if (/leather|shearling|sheepskin|\bb3\b/.test(question)) return 'Leather Jackets'
  if (/puffer|fur hood|matte|glossy/.test(question)) return 'Puffer Jackets'
  if (/bomber/.test(question)) return 'Bomber Jackets'
  if (/varsity|letterman/.test(question)) return 'Varsity Jackets'
  if (/denim|bridal|wedding/.test(question)) return 'Denim Jackets'
  if (/coach jacket/.test(question)) return 'Coach Jackets'
  if (/hoodie|portrait/.test(question)) return 'Fleece Hoodies'
  if (/tracking|track my order/.test(question)) return 'Orders'
  if (/shipping|delivery charges|ship to/.test(question)) return 'Shipping'
  if (/take.*deliver|production|rush order|bulk order/.test(question)) return 'Production & Delivery'
  return sections.has(current) ? current : 'General'
}

function american(text) {
  const words = { colour: 'color', colours: 'colors', personalise: 'personalize', personalised: 'personalized', personalisation: 'personalization', favourite: 'favorite', favourites: 'favorites' }
  return text.replace(/\b(colours?|personalise[ds]?|personalisation|favourites?)\b/gi, word => {
    const replacement = words[word.toLowerCase()] || word
    return /^[A-Z]/.test(word) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement
  })
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
try {
  const db = mongoose.connection.db
  const [faqs, posts, products, categories] = await Promise.all([
    db.collection('faqs').find({}).toArray(), db.collection('blogposts').find({}).toArray(),
    db.collection('products').find({}).toArray(), db.collection('categories').find({}).toArray(),
  ])
  const categoriesById = new Map(categories.map(category => [String(category._id), category]))
  const urls = new Map()
  for (const product of products) {
    const segments = []; const seen = new Set()
    let category = categoriesById.get(String(product.categoryId))
    while (category) {
      if (seen.has(String(category._id))) throw new Error('Category cycle')
      seen.add(String(category._id)); segments.unshift(category.slug === 'wool' ? 'all-wool' : category.slug)
      category = categoriesById.get(String(category.parentId))
    }
    urls.set(product.slug, `/${segments.length ? segments.join('/') : 'products'}/${product.slug}`)
  }
  const unresolved = new Set()
  function replaceLinks(text) {
    return text.replace(/(?:https:\/\/(?:www\.)?jacketee\.com)?\/products\/([a-zA-Z0-9-]+)/g, (original, slug) => {
      const url = urls.get(slug)
      if (!url) { unresolved.add(original); return original }
      return original.startsWith('https:') ? `https://www.jacketee.com${url}` : url
    })
  }
  const changes = []
  for (const faq of faqs) {
    const next = {
      category: categoryFor(faq), question: american(faq.question),
      answer: (faq.answer || []).map(text => american(replaceLinks(text))),
      bullets: (faq.bullets || []).map(text => american(replaceLinks(text))),
      ordered: (faq.ordered || []).map(text => american(replaceLinks(text))),
    }
    if (next.question === 'How long my custom jacket order will take to deliver?') next.question = 'How long does my custom jacket order take to deliver?'
    if (next.question === 'Do you offer returns and Exchange?') next.question = 'Do you offer returns and exchanges?'
    if (next.question === 'Where can I read customer reviews about Jacketee?') next.answer = ['Customer reviews appear on product pages once customers submit them and they are approved. For past team or school references, contact info@jacketee.com.']
    const before = Object.fromEntries(Object.keys(next).map(key => [key, faq[key] || (key === 'category' || key === 'question' ? '' : [])]))
    if (JSON.stringify(before) !== JSON.stringify(next)) changes.push({ collection: 'faqs', id: String(faq._id), before, after: next })
  }
  for (const post of posts) {
    const before = { content: post.content, excerpt: post.excerpt }
    const after = { content: replaceLinks(post.content || ''), excerpt: replaceLinks(post.excerpt || '') }
    if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ collection: 'blogposts', id: String(post._id), before, after })
  }
  fs.writeFileSync(path.join(output, apply ? 'content-migration-applied.json' : 'content-migration-dry-run.json'), JSON.stringify({ apply, unresolved: [...unresolved], changes }, null, 2))
  console.log(JSON.stringify({ apply, changes: changes.length, unresolved: [...unresolved] }))
  for (const change of changes) console.log(JSON.stringify(change))
  if (apply) {
    fs.writeFileSync(path.join(output, `content-backup-${Date.now()}.json`), JSON.stringify({ faqs, posts }, null, 2))
    for (const change of changes) {
      const result = await db.collection(change.collection).updateOne({ _id: new mongoose.Types.ObjectId(change.id), ...change.before }, { $set: { ...change.after, updatedAt: new Date() } })
      if (result.matchedCount !== 1) throw new Error(`Concurrent content change: ${change.id}`)
    }
  }
} finally {
  await mongoose.disconnect()
}
