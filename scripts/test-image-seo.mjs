import 'dotenv/config'
import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
await mongoose.connect(process.env.MONGODB_URI)
const products = await mongoose.connection.db.collection('products').find({}).project({ name: 1, slug: 1, images: 1 }).toArray()
const failures = []
let imageCount = 0

for (const product of products) {
  for (const [index, image] of (product.images || []).entries()) {
    imageCount++
    const alt = String(image.alt || '').trim()
    if (!alt || alt.toLowerCase() === String(product.name).trim().toLowerCase()) {
      failures.push({ slug: product.slug, index, reason: 'missing or generic alt' })
    }
  }
}

await mongoose.disconnect()
console.log(`Audited ${imageCount} images across ${products.length} products; ${failures.length} failed.`)
for (const failure of failures) console.log(failure)
if (failures.length) process.exitCode = 1
