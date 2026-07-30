import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { getStaticProducts } from '@/lib/static-data'
import { resolveAncestorChain } from '@/lib/categories'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = (searchParams.get('q') || '').trim()

    if (q.length < 2) {
      return NextResponse.json([])
    }

    const db = await connectDB()
    if (db) {
      const filter: any = {
        inStock: true,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
        ],
      }

      const products = await Product.find(filter)
        .sort({ name: 1 })
        .limit(8)
        .select('name slug price compareAtPrice images categoryId')
        .populate('categoryId', 'name slug')
        .lean()

      const allCategories = await Category.find().lean()
      const categoryChainNodes = allCategories.map((c: any) => ({
        _id: String(c._id),
        parentId: c.parentId ? String(c.parentId) : null,
        name: c.name,
        slug: c.slug,
      }))

      const mapped = products.map((p: any) => ({
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        thumbnail: p.images?.[0]?.url || '/placeholder.png',
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        categoryPath: p.categoryId
          ? resolveAncestorChain(categoryChainNodes, String(p.categoryId._id)).map((c) => ({ name: c.name, slug: c.slug }))
          : [],
      }))

      return NextResponse.json(mapped)
    }

    // Static fallback
    const qLower = q.toLowerCase()
    const matches = getStaticProducts()
      .filter((p: any) => p.inStock && p.name.toLowerCase().includes(qLower))
      .slice(0, 8)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        thumbnail: p.images?.[0]?.url || '/placeholder.png',
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        categoryPath: p.categoryPath || [],
      }))

    return NextResponse.json(matches)
  } catch (error: any) {
    console.error('Error in search-autocomplete:', error)
    return NextResponse.json([])
  }
}
