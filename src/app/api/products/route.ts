import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { getStaticProducts } from '@/lib/static-data'

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
    if (db) {
      const filter: any = {}
      if (!all) {
        filter.inStock = true
      }

      if (categorySlug && categorySlug !== 'all') {
        const category = await Category.findOne({ slug: categorySlug })
        if (category) filter.categoryId = category._id
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

      const mapped = products.map((p: any) => ({
        ...p,
        id: String(p._id),
        category: p.categoryId ? { _id: String(p.categoryId._id), name: p.categoryId.name, slug: p.categoryId.slug } : null,
      }))

      return NextResponse.json(mapped)
    }

    // Static fallback - FIX BUG #3: don't mutate the original array
    let filteredProducts = getStaticProducts()
    if (!all) {
      filteredProducts = filteredProducts.filter((p) => p.inStock)
    }

    if (categorySlug && categorySlug !== 'all') {
      filteredProducts = filteredProducts.filter((p) => p.category?.slug === categorySlug)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredProducts = filteredProducts.filter(
        (p) => p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower)
      )
    }

    if (sort === 'featured') {
      filteredProducts = [...filteredProducts].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1
        if (!a.isFeatured && b.isFeatured) return 1
        return 0
      })
    } else if (sort === 'price') {
      filteredProducts = [...filteredProducts].sort((a, b) =>
        order === 'asc' ? a.price - b.price : b.price - a.price
      )
    } else if (sort === 'name') {
      filteredProducts = [...filteredProducts].sort((a, b) =>
        order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      )
    }

    return NextResponse.json(filteredProducts)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(getStaticProducts())
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const { name, slug, description, price, compareAtPrice, categoryId, images, variants, isFeatured, inStock } = body

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