import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { buildProductUrl, resolveAncestorChain } from '@/lib/categories'

export async function GET() {
  try {
    const db = await connectDB()
    if (!db) return NextResponse.json([])

    const reviews = await Review.find({ status: 'approved', rating: { $gte: 4 }, comment: { $ne: '' } })
      .sort({ createdAt: -1 })
      .limit(24)
      .lean()

    if (!reviews.length) return NextResponse.json([])

    const products = await Product.find({ _id: { $in: reviews.map((review) => review.productId) }, inStock: true })
      .select('name slug categoryId')
      .lean()
    const productById = new Map(products.map((product) => [String(product._id), product]))
    const categories = await Category.find().select('name slug parentId').lean()
    const categoryNodes = categories.map((category) => ({
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ? String(category.parentId) : null,
    }))

    const highlights = reviews.flatMap((review) => {
      const product = productById.get(String(review.productId))
      if (!product?.slug) return []

      const categoryPath = product.categoryId
        ? resolveAncestorChain(categoryNodes, String(product.categoryId)).map((category) => ({ name: category.name, slug: category.slug }))
        : []

      return [{
        id: String(review._id),
        name: review.userName || 'Jacketee customer',
        rating: review.rating,
        comment: review.comment,
        image: review.images?.find((url) => /^https:\/\//.test(url)) || null,
        productName: product.name,
        productHref: buildProductUrl({ slug: product.slug, categoryPath }),
      }]
    })

    highlights.sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))
    return NextResponse.json(highlights.slice(0, 3))
  } catch (error) {
    console.error('Homepage review highlights error:', error)
    return NextResponse.json([])
  }
}
