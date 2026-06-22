import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { getStaticCategoriesWithCount, getStaticCategories } from '@/lib/static-data'

export async function GET() {
  try {
    const db = await connectDB()
    if (db) {
      const categories = await Category.find().lean()
      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const count = await Product.countDocuments({ categoryId: cat._id, inStock: true })
          return { ...cat, id: String(cat._id), _count: { products: count } }
        })
      )
      return NextResponse.json(categoriesWithCount)
    }
    return NextResponse.json(getStaticCategoriesWithCount())
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(getStaticCategoriesWithCount())
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const { name, slug, description, image } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const category = await Category.create({ name, slug, description, image })
    return NextResponse.json({ ...category.toObject(), id: String(category._id) }, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Category with this name or slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}