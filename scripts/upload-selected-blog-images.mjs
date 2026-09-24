import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { MongoClient } from 'mongodb'

const root = 'C:/Users/arehman/.codex/generated_images/01a0821b-8390-7ac3-9e1e-eace1cf999a8'
const images = {
  'what-to-put-on-a-varsity-jacket': 'exec-df692d31-71aa-495c-a1d3-e132952af3d7.png',
  'retro-varsity-jackets-guide': 'exec-01ee473a-16d1-44af-981c-26a7c7f23bbe.png',
  'satin-varsity-jackets-guide': 'exec-1e5385e7-6b50-4ac2-bc58-c954c6caa420.png',
  'all-leather-vs-wool-leather-varsity-jacket': 'exec-9a72aa03-f604-466c-8577-ea8d07d88afb.png',
  'varsity-jacket-vs-letterman-jacket': 'exec-b5d83955-9b3f-488d-be4d-e7df06b1646b.png',
}

for (const key of ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (!process.env[key]) throw new Error(`${key} is not configured`)
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()

try {
  const posts = client.db().collection('blogposts')
  const results = []

  for (const [slug, filename] of Object.entries(images)) {
    const post = await posts.findOne({ slug }, { projection: { title: 1, featuredImage: 1 } })
    if (!post) throw new Error(`Blog post not found: ${slug}`)

    const uploaded = await cloudinary.uploader.upload(`${root}/${filename}`, {
      public_id: `jacketee/blogs/posts/${slug}-featured`,
      resource_type: 'image',
      overwrite: true,
      invalidate: true,
      unique_filename: false,
      use_filename: false,
      format: 'webp',
      quality: 'auto:good',
    })
    const update = await posts.updateOne(
      { _id: post._id, featuredImage: post.featuredImage },
      { $set: { featuredImage: uploaded.secure_url, ogImage: uploaded.secure_url, updatedAt: new Date() } },
    )
    if (update.modifiedCount !== 1) {
      await cloudinary.uploader.destroy(uploaded.public_id)
      throw new Error(`Database record changed before update: ${slug}`)
    }

    results.push({
      title: post.title,
      slug,
      previousUrl: post.featuredImage,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    })
  }

  console.log(JSON.stringify({ updated: results.length, results }, null, 2))
} finally {
  await client.close()
}
