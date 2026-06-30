import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import mongoose from 'mongoose'
import { findStaticProduct, getStaticProducts } from '@/lib/static-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const db = await connectDB()
    let baseProduct: any = null

    if (db) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        baseProduct = await Product.findById(id).lean()
      }
      if (!baseProduct) {
        baseProduct = await Product.findOne({ slug: id }).lean()
      }
    }

    if (!baseProduct) {
      baseProduct = findStaticProduct(id)
    }

    if (!baseProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const baseProductId = String(baseProduct._id || baseProduct.id)
    const categoryIdStr = String(baseProduct.categoryId)

    let relatedProducts: any[] = []

    if (db) {
      // Fetch in-stock products in the same category (excluding current)
      const query: any = {
        inStock: true,
        _id: { $ne: new mongoose.Types.ObjectId(baseProductId) }
      }
      
      if (baseProduct.categoryId) {
        query.categoryId = baseProduct.categoryId
      }

      relatedProducts = await Product.find(query)
        .populate('categoryId', 'name slug')
        .limit(8)
        .lean()

      relatedProducts = relatedProducts.map((p) => ({
        ...p,
        id: String(p._id),
        category: p.categoryId ? { _id: String(p.categoryId._id), name: p.categoryId.name, slug: p.categoryId.slug } : null,
      }))

      // If we don't have enough, backfill with featured products from other categories
      if (relatedProducts.length < 3) {
        const extra = await Product.find({
          inStock: true,
          _id: { 
            $ne: new mongoose.Types.ObjectId(baseProductId),
            $nin: relatedProducts.map(p => new mongoose.Types.ObjectId(p.id))
          }
        })
          .populate('categoryId', 'name slug')
          .limit(5 - relatedProducts.length)
          .lean()

        const mappedExtra = extra.map((p) => ({
          ...p,
          id: String(p._id),
          category: p.categoryId ? { _id: String(p.categoryId._id), name: p.categoryId.name, slug: p.categoryId.slug } : null,
        }))

        relatedProducts = [...relatedProducts, ...mappedExtra]
      }
    } else {
      // Fallback using static data
      const allStatic = getStaticProducts()
      relatedProducts = allStatic.filter(
        (p) => String(p.categoryId) === categoryIdStr && p.id !== baseProductId && p.inStock
      )

      if (relatedProducts.length < 3) {
        const extra = allStatic.filter(
          (p) => String(p.categoryId) !== categoryIdStr && p.id !== baseProductId && p.inStock
        )
        relatedProducts = [...relatedProducts, ...extra].slice(0, 8)
      }
    }

    // Split recommendations:
    // frequentlyBoughtTogether gets 1-2 items
    // youMayAlsoLike gets up to 6 items
    const frequentlyBoughtTogether = relatedProducts.slice(0, 2)
    const youMayAlsoLike = relatedProducts.slice(1, 7)

    return NextResponse.json({
      frequentlyBoughtTogether,
      youMayAlsoLike,
    })
  } catch (error: any) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ frequentlyBoughtTogether: [], youMayAlsoLike: [] })
  }
}
