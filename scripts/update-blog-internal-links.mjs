import 'dotenv/config'
import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')

await mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection.db
const [categories, products, posts] = await Promise.all([
  db.collection('categories').find({}).toArray(),
  db.collection('products').find({ inStock: true }).sort({ isFeatured: -1, createdAt: -1 }).toArray(),
  db.collection('blogposts').find({ status: { $in: ['published', 'scheduled'] } }).toArray(),
])

const categoryById = new Map(categories.map((category) => [String(category._id), category]))
const rootSlugFor = (categoryId) => {
  let category = categoryById.get(String(categoryId))
  while (category?.parentId) category = categoryById.get(String(category.parentId))
  return category?.slug || ''
}
const productsByRoot = new Map()
for (const product of products) {
  const root = rootSlugFor(product.categoryId)
  if (root && !productsByRoot.has(root)) productsByRoot.set(root, product)
}

const rootForPost = (post) => {
  const topic = `${post.title || ''} ${(post.tags || []).join(' ')}`.toLowerCase()
  if (topic.includes('bomber')) return 'bomber-jackets'
  if (topic.includes('coach')) return 'coach-jackets'
  if (topic.includes('denim')) return 'denim-jackets'
  if (topic.includes('puffer')) return 'puffer-jackets'
  if (topic.includes('hoodie') || topic.includes('fleece')) return 'fleece-hoodies'
  if (topic.includes('leather') && !topic.includes('letterman')) return 'leather-jackets'
  return 'varsity-jackets'
}

let updated = 0
let retained = 0
let unavailable = 0
for (const post of posts) {
  if (Array.isArray(post.taggedProducts) && post.taggedProducts.length > 0) {
    retained++
    continue
  }
  const product = productsByRoot.get(rootForPost(post)) || productsByRoot.get('varsity-jackets')
  if (!product) {
    unavailable++
    continue
  }
  await db.collection('blogposts').updateOne(
    { _id: post._id, $or: [{ taggedProducts: { $exists: false } }, { taggedProducts: { $size: 0 } }] },
    { $set: { taggedProducts: [product._id], updatedAt: new Date() } },
  )
  updated++
}

console.log(`Blog internal links updated: ${updated}; existing product links retained: ${retained}; no product available: ${unavailable}.`)
await mongoose.disconnect()
