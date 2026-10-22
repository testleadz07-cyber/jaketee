import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { MongoClient } from 'mongodb'
import { readFile, writeFile, access } from 'node:fs/promises'

const manifestPath = 'output/imagegen/home-hero/manifest.json'
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
if (manifest.section !== 'home-hero' || manifest.images.length !== 2 || !['desktop', 'mobile'].every(key => manifest.images.some(image => image.key === key))) throw new Error('Both homepage hero compositions are required.')
for (const image of manifest.images) await access(image.file)
for (const key of ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) if (!process.env[key]) throw new Error(`${key} is not configured`)
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
await client.connect()
try {
  const collection = client.db().collection('sectionimages')
  const backup = 'output/imagegen/home-hero/previous-section-images.json'
  try { await access(backup) } catch { await writeFile(backup, JSON.stringify(await collection.find({ section: manifest.section }).toArray(), null, 2) + '\n') }
  for (const image of manifest.images) {
    if (!image.url) {
      const uploaded = await cloudinary.uploader.upload(image.file, { public_id: `jacketee/home/hero/${manifest.assetVersion}/${image.key}`, resource_type: 'image', overwrite: false, unique_filename: false, use_filename: false, format: 'webp', quality: 'auto:good', timeout: 120000 })
      Object.assign(image, { url: uploaded.secure_url, publicId: uploaded.public_id, width: uploaded.width, height: uploaded.height })
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    }
    const response = await fetch(image.url)
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Cloudinary verification failed: ${image.key}`)
    const existing = await collection.findOne({ section: manifest.section, key: image.key })
    if (existing?.url !== image.url) await collection.updateOne({ section: manifest.section, key: image.key, url: existing?.url ?? { $exists: false } }, {
      $set: { url: image.url, publicId: image.publicId, originalUrl: existing?.originalUrl || existing?.url || 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1788899943/clothaa/exports/patches-embroidery/hero__varsity-jacket-patches-embroidery-hero.jpg', alt: image.alt, width: image.width, height: image.height, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() },
    }, { upsert: !existing })
    if ((await collection.findOne({ section: manifest.section, key: image.key }))?.url !== image.url) throw new Error(`Database verification failed: ${image.key}`)
    console.log(JSON.stringify({ key: image.key, uploaded: true, databaseSaved: true }))
  }
  await writeFile('src/data/home-hero-images.json', JSON.stringify(manifest.images.map(({ key, url, publicId, alt, width, height }) => ({ key, url, publicId, alt, width, height })), null, 2) + '\n')
  await writeFile('output/imagegen/home-hero/prompts.md', ['# Homepage hero images', '', 'Generated with the built-in image_gen tool. Original PNGs are saved inside this workspace.', '', ...manifest.images.flatMap(image => [`## ${image.key}`, '', `Source: D:/luxestore/luxestore-late/${image.file}`, '', `Cloudinary: ${image.url}`, '', image.prompt, ''])].join('\n'))
  console.log('Both homepage hero images verified in Cloudinary, MongoDB and the fallback manifest.')
} finally { await client.close() }
