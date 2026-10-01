import 'dotenv/config'
import mongoose from 'mongoose'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function recalcProductStats(reviews, products, productId) {
  const stats = await reviews.aggregate([
    { $match: { productId, status: 'approved' } },
    { $group: { _id: '$productId', reviewCount: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
  ]).toArray()

  await products.updateOne(
    { _id: productId },
    { $set: stats[0]
      ? { reviewCount: stats[0].reviewCount, averageRating: Math.round(stats[0].averageRating * 10) / 10 }
      : { reviewCount: 0, averageRating: 0 } },
  )
}

async function main() {
  assert(process.env.MONGODB_URI, 'MONGODB_URI is required')
  await mongoose.connect(process.env.MONGODB_URI)

  const db = mongoose.connection.db
  const products = db.collection('products')
  const reviews = db.collection('reviews')
  const users = db.collection('users')
  const product = await products.findOne({})
  assert(product, 'A product is required to run the review lifecycle test')

  const userId = new mongoose.Types.ObjectId()
  const reviewId = new mongoose.Types.ObjectId()
  const marker = `review-e2e-${Date.now()}`

  try {
    await users.insertOne({
      _id: userId,
      name: 'Review Lifecycle Test',
      email: `${marker}@example.invalid`,
      role: 'customer',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await reviews.insertOne({
      _id: reviewId,
      productId: product._id,
      userId,
      userName: 'Review Lifecycle Test',
      rating: 5,
      title: marker,
      comment: 'Temporary review lifecycle test.',
      isVerified: false,
      images: [],
      videos: [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const stored = await reviews.findOne({ _id: reviewId })
    assert(stored?.status === 'pending', 'Submitted review was not stored as pending')
    assert(await reviews.countDocuments({ _id: reviewId, status: 'approved' }) === 0, 'Pending review leaked into public results')

    await reviews.updateOne({ _id: reviewId }, { $set: { status: 'approved', updatedAt: new Date() } })
    await recalcProductStats(reviews, products, product._id)
    assert(await reviews.countDocuments({ _id: reviewId, status: 'approved' }) === 1, 'Approved review was not publicly queryable')

    await reviews.updateOne({ _id: reviewId }, { $set: { status: 'rejected', updatedAt: new Date() } })
    await recalcProductStats(reviews, products, product._id)
    assert(await reviews.countDocuments({ _id: reviewId, status: 'approved' }) === 0, 'Rejected review remained publicly queryable')

    console.log('PASS: submit -> store pending -> approve/display -> reject/hide')
  } finally {
    await reviews.deleteOne({ _id: reviewId })
    await users.deleteOne({ _id: userId })
    await recalcProductStats(reviews, products, product._id)
    await mongoose.disconnect()
  }
}

main().catch(async (error) => {
  console.error('Review lifecycle test failed:', error)
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
  process.exit(1)
})
