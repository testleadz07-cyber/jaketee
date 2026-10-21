import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { MongoClient } from 'mongodb'
import { readFile, writeFile } from 'node:fs/promises'

// Uses the same credentials, WebP upload settings and guarded DB writes as
// upload-selected-blog-images.mjs, scoped to the six homepage categories.
const manifestPath = process.argv[2] || 'output/imagegen/home-categories/manifest.json'
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
for (const key of ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (!process.env[key]) throw new Error(`${key} is not configured`)
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
await client.connect()
try {
  const categories = client.db().collection('categories')
  for (const image of manifest.images) {
    const category = await categories.findOne({ slug: image.slug })
    if (!category) throw new Error(`Category missing: ${image.slug}`)
    if (image.url && category.image === image.url) continue
    const uploaded = await cloudinary.uploader.upload(image.file, {
      public_id: `jacketee/categories/${image.slug}/${manifest.assetName || 'homepage-2026-10-21'}`,
      resource_type: 'image', overwrite: false, unique_filename: false,
      use_filename: false, format: 'webp', quality: 'auto:good',
    })
    const response = await fetch(uploaded.secure_url)
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error(`Uploaded image could not be verified: ${image.slug}`)
    }
    const update = await categories.updateOne(
      { _id: category._id, image: category.image ?? { $exists: false } },
      { $set: { image: uploaded.secure_url, updatedAt: new Date() } },
    )
    if (update.modifiedCount !== 1) throw new Error(`Category changed before save: ${image.slug}`)
    Object.assign(image, { previousUrl: category.image ?? null, url: uploaded.secure_url, publicId: uploaded.public_id })
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    console.log(JSON.stringify({ slug: image.slug, saved: true, url: image.url }))
  }
  for (const image of manifest.images) {
    const saved = await categories.findOne({ slug: image.slug })
    if (saved?.image !== image.url) throw new Error(`Saved image mismatch: ${image.slug}`)
  }
  console.log('Verified all six category images in MongoDB.')
} finally {
  await client.close()
}
