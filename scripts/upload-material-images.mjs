import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { MongoClient } from 'mongodb'
import { readFile, writeFile, access } from 'node:fs/promises'

const manifestPath = process.argv[2] || 'output/imagegen/materials-colors/manifest.json'
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const previousAssets = JSON.parse(await readFile('output/imagegen/materials-colors/existing.json', 'utf8'))
const ids = ['melton-wool', 'cowhide-leather', 'sheep-leather', 'faux-leather', 'polyester-satin', 'cotton-fleece', 'cotton-twill', 'soft-shell', 'nylon-twill', 'suede-leather', 'snaps-zips']
const expected = ['hero', ...ids.flatMap(id => [`${id}-main`, `${id}-detail`])]
if (manifest.section !== 'materials-colors' || manifest.images.length !== expected.length || new Set(manifest.images.map(image => image.key)).size !== expected.length || expected.some(key => !manifest.images.some(image => image.key === key))) throw new Error('The complete 23-image material set is required before publishing.')
for (const image of manifest.images) await access(image.file)
for (const key of ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) if (!process.env[key]) throw new Error(`${key} is not configured`)
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
await client.connect()
try {
  const collection = client.db().collection('sectionimages')
  const originals = await collection.find({ section: manifest.section }).toArray()
  const backupPath = 'output/imagegen/materials-colors/previous-section-images.json'
  try { await access(backupPath) } catch { await writeFile(backupPath, JSON.stringify(originals, null, 2) + '\n') }
  for (const image of manifest.images) {
    image.previousUrl ||= previousAssets.find(asset => asset.key === image.key)?.url
    if (!image.url) {
      const uploaded = await cloudinary.uploader.upload(image.file, {
        public_id: `jacketee/materials-colors/${manifest.assetVersion}/${image.key}`,
        resource_type: 'image', overwrite: false, unique_filename: false,
        use_filename: false, format: 'webp', quality: 'auto:good', timeout: 120000,
      })
      Object.assign(image, { url: uploaded.secure_url, publicId: uploaded.public_id, width: uploaded.width, height: uploaded.height })
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    }
    const response = await fetch(image.url)
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Image verification failed: ${image.key}`)
    const existing = await collection.findOne({ section: manifest.section, key: image.key })
    if (existing?.url !== image.url) {
      await collection.updateOne({ section: manifest.section, key: image.key, url: existing?.url ?? { $exists: false } }, {
        $set: { url: image.url, publicId: image.publicId, originalUrl: existing?.originalUrl || existing?.url || image.previousUrl, alt: image.alt, width: image.width, height: image.height, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      }, { upsert: !existing })
    }
    const saved = await collection.findOne({ section: manifest.section, key: image.key })
    if (saved?.url !== image.url) throw new Error(`Database verification failed: ${image.key}`)
    console.log(JSON.stringify({ key: image.key, uploaded: true, databaseSaved: true }))
  }
  await writeFile('src/data/material-images.json', JSON.stringify(manifest.images.map(({ key, url, alt, publicId, width, height }) => ({ key, url, alt, publicId, width, height })), null, 2) + '\n')
  console.log('All 23 Cloudinary images verified, saved to MongoDB, and written to the fallback manifest.')
} finally { await client.close() }
