// src/app/api/admin/bulk-edit/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'

// Ensure DB connection helper
async function ensureDB() {
  if ((await import('mongoose')).default.connection.readyState === 0) {
    await connectDB()
  }
}

// GET: return paginated list of products
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Number(searchParams.get('limit') ?? '20')
  const skip = (page - 1) * limit

  try {
    await ensureDB()
    const products = await Product.find({})
      .populate('categoryId', 'name slug')
      .skip(skip)
      .limit(limit)
      .lean()
    const total = await Product.countDocuments({})
    const mappedProducts = products.map((product: any) => ({
      ...product,
      _id: String(product._id),
      id: String(product._id),
      categoryId: product.categoryId ? String(product.categoryId._id) : null,
      category: product.categoryId
        ? { id: String(product.categoryId._id), name: product.categoryId.name, slug: product.categoryId.slug }
        : null,
    }))
    return NextResponse.json(
      { products: mappedProducts, total, page, limit },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('GET /api/admin/bulk-edit error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// PUT: bulk update array of product changes
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureDB()
    const updates: Array<{ id: string; stock?: number; price?: number; isFeatured?: boolean; tags?: string[]; categoryId?: string }> = await request.json()
    const categoryIds = [...new Set(updates.map((u) => u.categoryId).filter((id): id is string => Boolean(id)))]
    if (categoryIds.length > 0) {
      const categoryCount = await Category.countDocuments({ _id: { $in: categoryIds } })
      if (categoryCount !== categoryIds.length) {
        return NextResponse.json({ error: 'One or more selected categories were not found' }, { status: 400 })
      }
    }

    const bulkOps = updates.map(u => {
      const update: any = {}
      if (typeof u.stock === 'number') {
        update.stockCount = u.stock
        update.inStock = u.stock > 0
      }
      if (typeof u.price === 'number') update.price = u.price
      if (typeof u.isFeatured === 'boolean') update.isFeatured = u.isFeatured
      if (Array.isArray(u.tags)) update.tags = u.tags
      if (typeof u.categoryId === 'string' && u.categoryId) update.categoryId = u.categoryId
      return {
        updateOne: {
          filter: { _id: u.id },
          update: { $set: update },
        },
      }
    })

    if (bulkOps.length > 0) {
      const result = await Product.bulkWrite(bulkOps)
      if (result.matchedCount !== bulkOps.length) {
        return NextResponse.json({ error: 'One or more products were not found' }, { status: 404 })
      }
    }
    return NextResponse.json({ success: true, updated: bulkOps.length })
  } catch (error) {
    console.error('PUT /api/admin/bulk-edit error:', error)
    return NextResponse.json({ error: 'Failed to update products' }, { status: 500 })
  }
}
