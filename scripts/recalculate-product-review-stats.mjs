import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb'

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured')

const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()

try {
  const db = client.db()
  const products = db.collection('products')
  const summaries = await db.collection('reviews').aggregate([
    { $match: { status: 'approved', rating: { $gte: 1, $lte: 5 } } },
    { $group: { _id: '$productId', reviewCount: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
  ]).toArray()

  const statsByProduct = new Map(
    summaries.map((summary) => [String(summary._id), {
      reviewCount: Number(summary.reviewCount),
      averageRating: Math.round(Number(summary.averageRating) * 10) / 10,
    }]),
  )
  const productIds = await products.find({}, { projection: { _id: 1 } }).toArray()
  const operations = productIds.map(({ _id }) => {
    const stats = statsByProduct.get(String(_id)) || { reviewCount: 0, averageRating: 0 }
    return {
      updateOne: {
        filter: { _id: new ObjectId(String(_id)) },
        update: { $set: stats },
      },
    }
  })

  const result = operations.length > 0 ? await products.bulkWrite(operations) : null
  console.log(JSON.stringify({
    database: db.databaseName,
    productsChecked: productIds.length,
    productsWithApprovedReviews: statsByProduct.size,
    productsUpdated: result?.modifiedCount || 0,
  }, null, 2))
} finally {
  await client.close()
}
