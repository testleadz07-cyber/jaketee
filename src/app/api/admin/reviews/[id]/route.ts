import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import mongoose from 'mongoose'

async function recalcProductStats(productId: mongoose.Types.ObjectId | string) {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(String(productId)), status: 'approved' } },
    {
      $group: {
        _id: '$productId',
        reviewCount: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ])

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    })
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      reviewCount: 0,
    })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'A valid status is required' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await recalcProductStats(review.productId)

    return NextResponse.json({
      ...review.toObject(),
      id: String(review._id),
      productId: String(review.productId),
      userId: String(review.userId),
    })
  } catch (error: any) {
    console.error('Admin review update error:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const review = await Review.findByIdAndDelete(id)
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await recalcProductStats(review.productId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin review delete error:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
