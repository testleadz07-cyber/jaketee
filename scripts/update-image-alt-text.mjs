import 'dotenv/config'
import mongoose from 'mongoose'

function imageAlt(name, url, index) {
  const filename = decodeURIComponent(String(url).split('/').pop()?.split('?')[0] || '').toLowerCase()
  const detailNumber = filename.match(/(?:^|[-_])detail[-_]?(\d+)/)?.[1]
  const label = /(?:^|[-_])back(?:[-_.]|$)/.test(filename) ? 'back view'
    : /(?:^|[-_])side(?:[-_.]|$)/.test(filename) ? 'side view'
    : /(?:^|[-_])front(?:[-_.]|$)/.test(filename) ? 'front view'
    : /(?:^|[-_])sleeve(?:[-_.]|$)/.test(filename) ? 'sleeve detail'
    : /(?:^|[-_])lining(?:[-_.]|$)/.test(filename) ? 'lining detail'
    : /(?:^|[-_])collar(?:[-_.]|$)/.test(filename) ? 'collar detail'
    : /(?:^|[-_])pocket(?:[-_.]|$)/.test(filename) ? 'pocket detail'
    : /(?:^|[-_])patch(?:[-_.]|$)/.test(filename) ? 'patch detail'
    : /(?:^|[-_])detail(?:[-_.]|$)/.test(filename) || detailNumber ? `detail view${detailNumber ? ` ${detailNumber}` : ''}`
    : /(?:^|[-_])main(?:[-_.]|$)/.test(filename) || index === 0 ? 'primary product view'
    : `additional product view ${index + 1}`
  return `${name} - ${label}`
}

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
await mongoose.connect(process.env.MONGODB_URI)
const collection = mongoose.connection.db.collection('products')
const products = await collection.find({}).toArray()
let imagesUpdated = 0
for (const product of products) {
  const images = (product.images || []).map((image, index) => {
    const generic = !String(image.alt || '').trim() || String(image.alt).trim().toLowerCase() === String(product.name).trim().toLowerCase()
    if (!generic) return image
    imagesUpdated++
    return { ...image, alt: imageAlt(product.name, image.url, index) }
  })
  await collection.updateOne({ _id: product._id }, { $set: { images, updatedAt: new Date() } })
}
console.log(`Updated ${imagesUpdated} image alt values across ${products.length} products.`)
await mongoose.disconnect()
