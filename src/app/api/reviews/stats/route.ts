import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import { publicRead } from '@/lib/public-cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const approvedReviewCount = await publicRead('approved-review-count', [], 300, ['public-support'], async () => {
      if (!await connectDB()) throw new Error('Reviews unavailable')
      return Review.countDocuments({ status: 'approved' })
    })
    return NextResponse.json({ approvedReviewCount })
  } catch (error) {
    console.error('Review stats fetch error:', error)
    return NextResponse.json({ approvedReviewCount: 0 })
  }
}
