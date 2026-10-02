import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from '../src/lib/mongodb'
import Product from '../src/models/Product'

async function run() {
  console.log('Connecting to database...')
  const db = await connectDB()
  if (!db) {
    console.error('Failed to connect to database')
    process.exit(1)
  }

  const result = await Product.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'active' } }
  )

  console.log(`Product status backfill complete. Matched: ${result.matchedCount}, modified: ${result.modifiedCount}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
