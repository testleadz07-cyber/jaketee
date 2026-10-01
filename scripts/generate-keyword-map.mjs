import 'dotenv/config'
import fs from 'node:fs/promises'
import mongoose from 'mongoose'

const categoryKeywords = {
  'varsity-jackets': 'personalized letterman jackets',
  'wool-leather': 'wool and leather varsity jacket',
  wool: 'all wool varsity jacket',
  satin: 'satin varsity jacket',
  'faux-leather': 'faux leather varsity jacket',
  'all-leather': 'all leather varsity jacket',
  hooded: 'hooded varsity jacket',
  retro: 'retro varsity jacket',
  fleece: 'fleece varsity jacket',
  'cotton-twill': 'cotton twill varsity jacket',
  'bomber-jackets': 'custom bomber jacket',
  'coach-jackets': 'custom coach jacket',
  'denim-jackets': 'custom denim jacket',
  'puffer-jackets': 'custom puffer jacket',
  'leather-jackets': 'custom leather jacket',
  'fleece-hoodies': 'custom fleece hoodies',
}

const staticPages = [
  ['/', 'custom varsity jackets', 'Commercial'],
  ['/shop', 'custom jackets online', 'Commercial'],
  ['/about', 'Jacketee custom jacket factory', 'Brand'],
  ['/bulk-orders', 'bulk varsity jackets', 'Commercial'],
  ['/bulk-orders/schools', 'school letterman jackets', 'Commercial'],
  ['/bulk-orders/corporate', 'corporate varsity jackets', 'Commercial'],
  ['/bulk-orders/private-label', 'private label jackets', 'Commercial'],
  ['/bulk-orders/sorority-fraternity', 'sorority and fraternity jackets', 'Commercial'],
  ['/bulk-orders/senior-class', 'senior class jackets', 'Commercial'],
  ['/bulk-orders/cheer', 'custom cheer jackets', 'Commercial'],
  ['/varsity-jackets/oversized', 'oversized varsity jackets', 'Commercial'],
  ['/varsity-jackets/vintage', 'vintage varsity jackets', 'Commercial'],
  ['/patches-embroidery', 'chenille patches for letterman jackets', 'Commercial'],
  ['/materials-colors', 'varsity jacket materials and colors', 'Informational'],
  ['/size-guide', 'jacket size guide', 'Informational'],
  ['/shipping', 'Jacketee shipping information', 'Support'],
  ['/returns', 'Jacketee returns policy', 'Support'],
  ['/track-order', 'track Jacketee order', 'Support'],
  ['/faq', 'Jacketee frequently asked questions', 'Support'],
  ['/contact', 'contact Jacketee', 'Support'],
  ['/blog', 'custom jacket guides', 'Informational'],
  ['/custom-bomber-jackets', 'design your own bomber jacket', 'Commercial'],
  ['/custom-coach-jackets', 'personalized coach jackets', 'Commercial'],
  ['/custom-denim-jackets', 'embroidered denim jackets', 'Commercial'],
  ['/custom-puffer-jackets', 'custom logo puffer jackets', 'Commercial'],
  ['/custom-hoodies', 'custom leavers hoodies', 'Commercial'],
  ['/custom-letterman-jackets', 'design your own letterman jacket', 'Commercial'],
  ['/privacy-policy', 'Jacketee privacy policy', 'Legal'],
  ['/terms-of-service', 'Jacketee terms of service', 'Legal'],
  ['/cookie-policy', 'Jacketee cookie policy', 'Legal'],
]

const cleanKeyword = (value) => String(value || '').replace(/\s*\|.*$/, '').replace(/[^a-zA-Z0-9&' -]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
await mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection.db
const [categories, products, posts, blogCategories] = await Promise.all([
  db.collection('categories').find({}).toArray(),
  db.collection('products').find({ inStock: true }).toArray(),
  db.collection('blogposts').find({ status: { $in: ['published', 'scheduled'] } }).toArray(),
  db.collection('blogcategories').find({}).toArray(),
])
const byId = new Map(categories.map((category) => [String(category._id), category]))
const categoryPath = (category) => {
  const nodes = []
  let current = category
  while (current) { nodes.unshift(current.slug === 'wool' ? 'all-wool' : current.slug); current = current.parentId ? byId.get(String(current.parentId)) : null }
  return `/${nodes.join('/')}`
}
const rows = staticPages.map(([url, keyword, intent]) => ({ type: 'Page', url, keyword, intent, status: 'Mapped' }))

for (const category of categories) rows.push({ type: 'Category', url: categoryPath(category), keyword: categoryKeywords[category.slug] || cleanKeyword(category.heading || category.name), intent: 'Commercial', status: categoryKeywords[category.slug] ? 'Mapped' : 'Review' })
for (const product of products) {
  const category = byId.get(String(product.categoryId))
  rows.push({ type: 'Product', url: `${categoryPath(category)}/${product.slug}`, keyword: cleanKeyword(product.name), intent: 'Transactional', status: 'Mapped' })
}
for (const post of posts) rows.push({ type: 'Blog', url: `/blog/${post.slug}`, keyword: cleanKeyword(post.title), intent: 'Informational', status: 'Mapped' })
for (const category of blogCategories) rows.push({ type: 'Blog category', url: `/blog/category/${category.slug}`, keyword: `${cleanKeyword(category.name)} articles`, intent: 'Informational', status: 'Mapped' })

const counts = new Map()
for (const row of rows) counts.set(row.keyword, (counts.get(row.keyword) || 0) + 1)
for (const row of rows) if (!row.keyword || counts.get(row.keyword) > 1) row.status = row.keyword ? 'Duplicate - review' : 'No clear target'

rows.sort((a, b) => a.url.localeCompare(b.url))
const lines = [
  ['Type', 'URL', 'Primary keyword', 'Intent', 'Status'].map(csv).join(','),
  ...rows.map((row) => [row.type, row.url, row.keyword, row.intent, row.status].map(csv).join(',')),
]
await fs.writeFile('docs/keyword-map.csv', `${lines.join('\n')}\n`, 'utf8')
const flagged = rows.filter((row) => row.status !== 'Mapped')
console.log(`Mapped ${rows.length} indexable pages; ${flagged.length} flagged for review.`)
for (const row of flagged) console.log(row)
await mongoose.disconnect()
