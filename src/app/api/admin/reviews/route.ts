import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const query: Record<string, any> = {}
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .lean()

    const productIds = Array.from(new Set(reviews.map((r: any) => String(r.productId))))
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug images')
      .lean()
    const productMap = new Map(products.map((p: any) => [String(p._id), p]))

    const mapped = reviews.map((r: any) => {
      const product = productMap.get(String(r.productId))
      return {
        ...r,
        id: String(r._id),
        productId: String(r.productId),
        userId: String(r.userId),
        product: product
          ? {
              id: String(product._id),
              name: product.name,
              slug: product.slug,
              image: product.images?.[0]?.url || null,
            }
          : null,
      }
    })

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('Admin reviews fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
