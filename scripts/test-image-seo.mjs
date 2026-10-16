import 'dotenv/config'
import mongoose from 'mongoose'
import { productImageAlt } from '../src/lib/image-alt.mjs'

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
try {
  const products = await mongoose.connection.db.collection('products').find({}).project({ name: 1, slug: 1, images: 1 }).toArray()
  const failures = []
  let imageCount = 0
  for (const product of products) {
    if (/For Mens|Mens And Women|Women Girls Mens/i.test(product.name)) failures.push({ slug: product.slug, reason: 'uncorrected audience' })
    for (const [index, image] of (product.images || []).entries()) {
      imageCount++
      if (image.alt !== productImageAlt(product.name, image.url, image.order ?? index)) {
        failures.push({ slug: product.slug, index, reason: 'alt does not match gallery template' })
      }
    }
  }
  console.log(`Audited ${imageCount} images across ${products.length} products; ${failures.length} failed.`)
  for (const failure of failures) console.log(failure)
  if (failures.length) process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
