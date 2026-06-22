import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Wishlist from '@/models/Wishlist'
import Product from '@/models/Product'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
    }

    const currentUserId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole !== 'admin' && currentUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to view this wishlist' }, { status: 403 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const wishlistItems = await Wishlist.find({ userId })
      .populate('productId')
      .lean()

    const mapped = wishlistItems
      .filter((item: any) => item.productId)
      .map((item: any) => {
        const product = item.productId
        return {
          id: String(item._id),
          productId: String(product._id),
          name: product.name,
          price: product.price,
          image: product.images[0]?.url || '',
          slug: product.slug,
          inStock: product.inStock,
        }
      })

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, productId } = body

    if (!userId || !productId) {
      return NextResponse.json({ error: 'UserId and productId are required' }, { status: 400 })
    }

    const currentUserId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole !== 'admin' && currentUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to modify this wishlist' }, { status: 403 })
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

    // Check if already exists
    const existing = await Wishlist.findOne({ userId, productId })
    if (existing) {
      return NextResponse.json({ error: 'Item already in wishlist' }, { status: 409 })
    }

    const item = await Wishlist.create({ userId, productId })
    return NextResponse.json({
      id: String(item._id),
      productId: String(product._id),
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || '',
      slug: product.slug,
      inStock: product.inStock,
    }, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Item already in wishlist' }, { status: 409 })
    }
    console.error('Wishlist create error:', error)
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, productId } = body

    if (!userId || !productId) {
      return NextResponse.json({ error: 'UserId and productId are required' }, { status: 400 })
    }

    const currentUserId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole !== 'admin' && currentUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to modify this wishlist' }, { status: 403 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const result = await Wishlist.findOneAndDelete({ userId, productId })
    if (!result) {
      return NextResponse.json({ error: 'Item not found in wishlist' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Item removed from wishlist' })
  } catch (error: any) {
    console.error('Wishlist delete error:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}
