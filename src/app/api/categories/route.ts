import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { getStaticCategoriesWithCount, getStaticCategories } from '@/lib/static-data'
import { resolveDescendantIds, type CategoryNode } from '@/lib/categories'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET() {
  try {
    const db = await connectDB()
    if (db) {
      const categories = await Category.find().lean()
      const nodes: CategoryNode[] = categories.map((c: any) => ({
        _id: String(c._id),
        parentId: c.parentId ? String(c.parentId) : null,
      }))

      const counts = await Product.aggregate([
        { $match: { inStock: true } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ])
      const countByCategoryId = new Map<string, number>(
        counts.map((c: any) => [String(c._id), c.count as number])
      )

      const categoriesWithCount = categories.map((cat: any) => {
        const descendantIds = resolveDescendantIds(nodes, String(cat._id))
        const count = descendantIds.reduce((sum, id) => sum + (countByCategoryId.get(id) || 0), 0)
        return {
          ...cat,
          id: String(cat._id),
          parentId: cat.parentId ? String(cat.parentId) : null,
          _count: { products: count },
        }
      })
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
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const { name, slug, description, image, parentId } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    let resolvedParentId = null
    if (parentId) {
      const parent = await Category.findById(parentId)
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 })
      }
      resolvedParentId = parentId
    }

    const category = await Category.create({ name, slug, description, image, parentId: resolvedParentId })
    return NextResponse.json({ ...category.toObject(), id: String(category._id) }, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Category with this name or slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}