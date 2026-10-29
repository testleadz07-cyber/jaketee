import { requireAdminApi } from '@/lib/require-admin'
import { invalidateHomeCache } from '@/lib/home-cache'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { resolveDescendantIds, type CategoryNode } from '@/lib/categories'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi()
    if (auth.response) return auth.response

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const { name, slug, description, seoTitle, seoDescription, heading, introShort, introLong, image, parentId } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const resolvedParentId = parentId && parentId !== 'none' ? parentId : null

    if (resolvedParentId) {
      if (resolvedParentId === id) {
        return NextResponse.json({ error: 'A category cannot be its own parent' }, { status: 400 })
      }

      const parent = await Category.findById(resolvedParentId)
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 })
      }

      const all = await Category.find({}, '_id parentId').lean()
      const nodes: CategoryNode[] = all.map((c: any) => ({
        _id: String(c._id),
        parentId: c.parentId ? String(c.parentId) : null,
      }))
      const ownDescendants = resolveDescendantIds(nodes, id)
      if (ownDescendants.includes(resolvedParentId)) {
        return NextResponse.json(
          { error: 'Cannot set parent to a descendant of this category' },
          { status: 400 }
        )
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug, description, seoTitle, seoDescription, heading, introShort, introLong, image, parentId: resolvedParentId },
      { returnDocument: 'after' }
    ).lean()

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await invalidateHomeCache('catalog')
    return NextResponse.json({ ...category, id: String((category as any)._id) })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Category with this name or slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi()
    if (auth.response) return auth.response

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    // Check if category has subcategories - must be deleted bottom-up
    const childCount = await Category.countDocuments({ parentId: id })
    if (childCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category because it has subcategories. Delete or reassign those first.' },
        { status: 400 }
      )
    }

    // Check if category is linked to any products
    const linkedProductCount = await Product.countDocuments({ categoryId: id })
    if (linkedProductCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category because it has linked products' },
        { status: 400 }
      )
    }

    const category = await Category.findByIdAndDelete(id)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await invalidateHomeCache('catalog')
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
