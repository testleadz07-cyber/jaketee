// src/app/api/admin/bulk-edit/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'

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
      .skip(skip)
      .limit(limit)
      .lean()
    const total = await Product.countDocuments({})
    return NextResponse.json({ products, total, page, limit })
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
    const updates: Array<{ id: string; stock?: number; price?: number; isFeatured?: boolean; tags?: string[] }> = await request.json()
    const bulkOps = updates.map(u => {
      const update: any = {}
      if (typeof u.stock === 'number') {
        update.stockCount = u.stock
        update.inStock = u.stock > 0
      }
      if (typeof u.price === 'number') update.price = u.price
      if (typeof u.isFeatured === 'boolean') update.isFeatured = u.isFeatured
      if (Array.isArray(u.tags)) update.tags = u.tags
      return {
        updateOne: {
          filter: { _id: u.id },
          update: { $set: update },
        },
      }
    })

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/admin/bulk-edit error:', error)
    return NextResponse.json({ error: 'Failed to update products' }, { status: 500 })
  }
}
