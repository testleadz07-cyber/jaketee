import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { MongoClient } from 'mongodb'
import { readFile, writeFile, copyFile } from 'node:fs/promises'
const manifestPath = 'output/imagegen/custom-design/manifest.json'
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
for (const key of ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (!process.env[key]) throw new Error(`${key} is not configured`)
}
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
await client.connect()
try {
  const collection = client.db().collection('sectionimages')
  for (const image of manifest.images) {
    if (!image.url) {
      const uploaded = await cloudinary.uploader.upload(image.file, {
        public_id: `jacketee/home/custom-design/${image.key}-personalized-2026-10-21`,
        resource_type: 'image', overwrite: false, unique_filename: false,
        use_filename: false, format: 'webp', quality: 'auto:good',
      })
      const response = await fetch(uploaded.secure_url)
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Invalid upload: ${image.key}`)
      Object.assign(image, { url: uploaded.secure_url, publicId: uploaded.public_id, width: uploaded.width, height: uploaded.height })
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    }
    await collection.updateOne({ section: 'home-custom-design', key: image.key }, {
      $set: { url: image.url, publicId: image.publicId, alt: image.alt, width: image.width, height: image.height, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    }, { upsert: true })
    const saved = await collection.findOne({ section: 'home-custom-design', key: image.key })
    if (saved?.url !== image.url) throw new Error(`Save failed: ${image.key}`)
    console.log(JSON.stringify({ key: image.key, saved: true, url: image.url }))
  }
  await writeFile('src/data/custom-design-images.json', JSON.stringify(manifest.images.map(({ key, url, alt }) => ({ key, url, alt })), null, 2) + '\n')
} finally { await client.close() }
