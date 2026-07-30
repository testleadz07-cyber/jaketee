import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from '../src/lib/mongodb'
import Activity from '../src/models/Activity'
import User from '../src/models/User'

async function check() {
  console.log('Connecting to database...')
  const db = await connectDB()
  if (!db) {
    console.error('Failed to connect to database')
    process.exit(1)
  }
  console.log('Connected!')

  const usersCount = await User.countDocuments()
  console.log('Total users in DB:', usersCount)

  const activitiesCount = await Activity.countDocuments()
  console.log('Total activities in DB:', activitiesCount)

  const latestActivities = await Activity.find().sort({ createdAt: -1 }).limit(10).lean()
  console.log('Latest 10 activities:', JSON.stringify(latestActivities, null, 2))

  process.exit(0)
}

check().catch((err) => {
  console.error(err)
  process.exit(1)
})
