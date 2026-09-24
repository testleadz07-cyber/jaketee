import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { MongoClient } from 'mongodb'

const slug = 'cotton-twill-varsity-jackets-guide'
const source = 'C:/Users/arehman/.codex/generated_images/01a0821b-8390-7ac3-9e1e-eace1cf999a8/exec-e302e2a1-f8a8-4997-8fcb-7b478e83f95d.png'
const publicId = `jacketee/blogs/posts/${slug}-featured`

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
  const post = await posts.findOne({ slug }, { projection: { title: 1, featuredImage: 1 } })
  if (!post) throw new Error(`Blog post not found: ${slug}`)

  const uploaded = await cloudinary.uploader.upload(source, {
    public_id: publicId,
    resource_type: 'image',
    overwrite: true,
    invalidate: true,
    unique_filename: false,
    use_filename: false,
    format: 'webp',
    quality: 'auto:good',
  })
  const result = await posts.updateOne(
    { _id: post._id, featuredImage: post.featuredImage },
    { $set: { featuredImage: uploaded.secure_url, ogImage: uploaded.secure_url, updatedAt: new Date() } },
  )
  if (result.modifiedCount !== 1) {
    await cloudinary.uploader.destroy(uploaded.public_id)
    throw new Error('Database record changed before the image update completed')
  }

  console.log(JSON.stringify({
    title: post.title,
    slug,
    previousUrl: post.featuredImage,
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  }, null, 2))
} finally {
  await client.close()
}
