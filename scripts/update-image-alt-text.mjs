import 'dotenv/config'
import mongoose from 'mongoose'
import { mkdir, writeFile } from 'node:fs/promises'
import { productImageAlt, cleanProductName } from '../src/lib/image-alt.mjs'

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
const apply = process.argv.includes('--apply')
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
try {
  const collection = mongoose.connection.db.collection('products')
  const products = await collection.find({}).toArray()
  const changes = products.flatMap((product) => {
    const name = cleanProductName(product.name)
    const images = (product.images || []).map((image, index) => ({
      ...image, alt: productImageAlt(name, image.url, image.order ?? index),
    }))
    if (name === product.name && JSON.stringify(images) === JSON.stringify(product.images || [])) return []
    return [{ product, name, images }]
  })
  console.log(`${apply ? 'Applying' : 'Previewing'} ${changes.length} product updates; ${changes.filter(({ product, name }) => product.name !== name).length} name corrections.`)
  for (const { product, name } of changes) {
    if (product.name !== name) console.log(`${product.name} -> ${name}`)
  }
  if (apply && changes.length) {
    await mkdir('output', { recursive: true })
    const backupPath = `output/image-alt-backup-${Date.now()}.json`
    await writeFile(backupPath, JSON.stringify(changes.map(({ product }) => ({ _id: String(product._id), name: product.name, images: product.images, updatedAt: product.updatedAt })), null, 2))
    console.log(`Backup saved to ${backupPath}`)
    const result = await collection.bulkWrite(changes.map(({ product, name, images }) => ({
      updateOne: { filter: { _id: product._id, name: product.name, images: product.images }, update: { $set: { name, images, updatedAt: new Date() } } },
    })))
    console.log(`Updated ${result.modifiedCount} products.`)
    if (result.matchedCount !== changes.length) throw new Error('Some products changed concurrently; rerun the preview.')
  }
} finally {
  await mongoose.disconnect()
}
