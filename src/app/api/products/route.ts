import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { resolveDescendantIds, resolveAncestorChain, type CategoryNode } from '@/lib/categories'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'name'
    const order = searchParams.get('order') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const all = searchParams.get('all') === 'true'

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const filter: any = {}
    if (!all) {
      filter.inStock = true
    }

    // Fetched once, used both for category-rollup filtering and for
    // resolving each product's full categoryPath (root -> leaf) below.
    const allCategories = await Category.find().lean()
    const categoryNodes: CategoryNode[] = allCategories.map((c: any) => ({
      _id: String(c._id),
      parentId: c.parentId ? String(c.parentId) : null,
    }))

    if (categorySlug && categorySlug !== 'all') {
      const category = allCategories.find((c: any) => c.slug === categorySlug)
      if (category) {
        const descendantIds = resolveDescendantIds(categoryNodes, String(category._id))
        filter.categoryId = { $in: descendantIds }
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    let sortObj: any = {}
    if (sort === 'featured') sortObj = { isFeatured: -1, createdAt: -1 }
    else if (sort === 'price') sortObj = { price: order === 'asc' ? 1 : -1 }
    else if (sort === 'name') sortObj = { name: order === 'asc' ? 1 : -1 }
    else sortObj = { createdAt: -1 }

    const products = await Product.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('categoryId', 'name slug')
      .lean()

    const categoryChainNodes = allCategories.map((c: any) => ({
      _id: String(c._id),
      parentId: c.parentId ? String(c.parentId) : null,
      name: c.name,
      slug: c.slug,
    }))

    const mapped = products.map((p: any) => ({
      ...p,
      id: String(p._id),
      category: p.categoryId ? { _id: String(p.categoryId._id), name: p.categoryId.name, slug: p.categoryId.slug } : null,
      categoryPath: p.categoryId
        ? resolveAncestorChain(categoryChainNodes, String(p.categoryId._id)).map((c) => ({ name: c.name, slug: c.slug }))
        : [],
    }))

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const { name, slug, description, price, compareAtPrice, categoryId, images, variants, embroidery, measurementFields, isFeatured, inStock } = body

    if (!name || !slug || !price || !categoryId) {
      return NextResponse.json({ error: 'Name, slug, price, and categoryId are required' }, { status: 400 })
    }

    const product = await Product.create({
      name,
      slug,
      description: description || '',
      price,
      compareAtPrice: compareAtPrice || null,
      categoryId,
      images: images || [],
      variants: variants || [],
      embroidery: embroidery || undefined,
      measurementFields: measurementFields || [],
      isFeatured: isFeatured || false,
      inStock: inStock !== false,
      stockCount: 100,
    })

    return NextResponse.json({ ...product.toObject(), id: String(product._id) }, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Product with this slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}