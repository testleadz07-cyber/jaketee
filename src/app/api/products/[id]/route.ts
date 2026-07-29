import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { resolveAncestorChain } from '@/lib/categories'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    let product
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).populate('categoryId', 'name slug').lean()
    }
    if (!product) {
      product = await Product.findOne({ slug: id }).populate('categoryId', 'name slug').lean()
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let categoryPath: { name: string; slug: string }[] = []
    if (product.categoryId) {
      const allCategories = await Category.find().lean()
      const categoryChainNodes = allCategories.map((c: any) => ({
        _id: String(c._id),
        parentId: c.parentId ? String(c.parentId) : null,
        name: c.name,
        slug: c.slug,
      }))
      categoryPath = resolveAncestorChain(categoryChainNodes, String((product.categoryId as any)._id)).map(
        (c) => ({ name: c.name, slug: c.slug })
      )
    }

    const mapped = {
      ...product,
      id: String(product._id),
      category: product.categoryId ? { _id: String((product.categoryId as any)._id), name: (product.categoryId as any).name, slug: (product.categoryId as any).slug } : null,
      categoryPath,
    }
    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const product = await Product.findByIdAndUpdate(id, {
      name: body.name,
      description: body.description,
      price: body.price,
      compareAtPrice: body.compareAtPrice || null,
      categoryId: body.categoryId,
      images: body.images || [],
      variants: body.variants || [],
      isFeatured: body.isFeatured,
      inStock: body.inStock,
      stockCount: body.stockCount || 100,
    }, { new: true }).lean()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ ...product, id: String(product._id) })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const product = await Product.findByIdAndDelete(id)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

import mongoose from 'mongoose'