import 'dotenv/config'
import { MongoClient } from 'mongodb'

const requestedSlugs = [
  'what-to-put-on-a-varsity-jacket',
  'retro-varsity-jackets-guide',
  'satin-varsity-jackets-guide',
  'all-leather-vs-wool-leather-varsity-jacket',
  'varsity-jacket-vs-letterman-jacket',
]

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured')
const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()

try {
  const posts = await client.db().collection('blogposts').find({
    $or: requestedSlugs.map((slug) => ({ slug: { $regex: `^${slug}` } })),
  }, { projection: { title: 1, slug: 1, featuredImage: 1 } }).toArray()
  console.log(JSON.stringify(posts.map(({ title, slug, featuredImage }) => ({ title, slug, featuredImage })), null, 2))
} finally {
  await client.close()
}
