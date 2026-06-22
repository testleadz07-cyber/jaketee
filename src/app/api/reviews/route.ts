import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'ProductId is required' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean()

    // Map _id to id
    const mapped = reviews.map((r: any) => ({
      ...r,
      id: String(r._id),
      productId: String(r.productId),
      userId: String(r.userId),
    }))

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, rating, title, comment } = body

    if (!productId || !rating || !comment) {
      return NextResponse.json({ error: 'ProductId, rating, and comment are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    // Verify product exists
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const userId = (session.user as any).id
    const userName = session.user.name || 'Anonymous'

    // Create the review
    const review = await Review.create({
      productId,
      userId,
      userName,
      rating,
      title,
      comment,
      isVerified: false, // Default false, admin can verify later
    })

    // Recalculate average rating and review count
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
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

    return NextResponse.json({
      ...review.toObject(),
      id: String(review._id),
      productId: String(review.productId),
      userId: String(review.userId),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Review submission error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
