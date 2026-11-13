import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { requireAdminApi } from '@/lib/require-admin'
import { connectDB } from '@/lib/mongodb'
import Activity from '@/models/Activity'
import User from '@/models/User'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { buildProductUrl, resolveAncestorChain } from '@/lib/categories'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  const requestedPage = Number(request.nextUrl.searchParams.get('page') || 1)
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
  try {
    if (!await connectDB()) return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    if (!await User.exists({ _id: id })) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const limit = 10
    const total = await Activity.countDocuments({ userId: id })
    const pages = Math.max(1, Math.ceil(total / limit))
    const page = Math.min(requestedPage, pages)
    const rows = await Activity.find({ userId: id }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean()
    const ids = [...new Set(rows.map(row => row.details?.productId).filter((value): value is string => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value)))]
    const products = ids.length ? await Product.find({ _id: { $in: ids } }).select('_id name slug categoryId').lean() : []
    const categories = products.some(product => product.categoryId) ? await Category.find({}).select('_id slug parentId').lean() : []
    const nodes = categories.map(category => ({ _id: String(category._id), slug: category.slug, parentId: category.parentId ? String(category.parentId) : null }))
    const productMap = new Map(products.map(product => {
      const categoryPath = product.categoryId ? resolveAncestorChain(nodes, String(product.categoryId)) : []
      const href = product.slug && (!product.categoryId || (categoryPath.length && !categoryPath[0].parentId)) ? buildProductUrl({ slug: product.slug, categoryPath }) : undefined
      return [String(product._id), { name: product.name, href }] as const
    }))
    return NextResponse.json({ total, pages, page, limit, activities: rows.map(row => {
      const product = productMap.get(String(row.details?.productId))
      return { id: String(row._id), action: row.action, createdAt: row.createdAt,
        details: { ...row.details, ...(product ? { productName: row.details?.productName || product.name, productHref: product.href } : {}) },
        country: row.country || 'Unknown', region: row.region, city: row.city, ip: row.ip, userAgent: row.userAgent }
    }) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('User activity fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
