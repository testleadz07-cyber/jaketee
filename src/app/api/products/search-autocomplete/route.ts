import { getPublicCategories } from '@/lib/public-catalog'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { resolveAncestorChain } from '@/lib/categories'
import { getCatalogProducts } from '@/lib/catalog-products'

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 200)
  if (q.length < 2) return NextResponse.json([])
  try {
    if (!await connectDB()) return NextResponse.json({ error: 'Search unavailable' }, { status: 503 })
    const categories = await getPublicCategories()
    const result = await getCatalogProducts({ filter: { inStock: true, isDraft: { $ne: true }, status: 'active' }, search: q, categories, sort: 'relevance', limit: 8 })
    const nodes = categories.map((category: any) => ({ _id: String(category._id), parentId: category.parentId ? String(category.parentId) : null, name: category.name, slug: category.slug }))
    return NextResponse.json(result.products.map((product: any) => ({
      id: String(product._id), name: product.name, slug: product.slug, price: product.searchMatch?.price ?? product.price,
      thumbnail: product.searchMatch?.image || product.images?.[0]?.url || '/placeholder.png',
      searchMatch: product.searchMatch,
      categoryPath: product.categoryId ? resolveAncestorChain(nodes, String(product.categoryId._id)).map(category => ({ name: category.name, slug: category.slug })) : [],
    })), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error in search-autocomplete:', error)
    return NextResponse.json({ error: 'Search unavailable' }, { status: 503 })
  }
}
