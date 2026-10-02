import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI || ''

if (!uri) {
  console.error('MONGODB_URI is not configured')
  process.exit(1)
}

try {
  console.log('Connecting to database...')
  await mongoose.connect(uri, { bufferCommands: false })

  const result = await mongoose.connection.collection('products').updateMany(
    { status: { $exists: false } },
    { $set: { status: 'active' } }
  )

  console.log(`Product status backfill complete. Matched: ${result.matchedCount}, modified: ${result.modifiedCount}`)
  await mongoose.disconnect()
  process.exit(0)
} catch (error) {
  console.error(error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
}
