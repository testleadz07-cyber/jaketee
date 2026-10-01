import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'

export const revalidate = 300

export async function GET() {
  try {
    const db = await connectDB()
    if (!db) return NextResponse.json({ approvedReviewCount: 0 })

    const approvedReviewCount = await Review.countDocuments({ status: 'approved' })
    return NextResponse.json({ approvedReviewCount })
  } catch (error) {
    console.error('Review stats fetch error:', error)
    return NextResponse.json({ approvedReviewCount: 0 })
  }
}
