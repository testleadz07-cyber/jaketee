import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { findStaticProduct } from '@/lib/static-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const db = await connectDB()
    if (db) {
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

      const mapped = {
        ...product,
        id: String(product._id),
        category: product.categoryId ? { _id: String(product.categoryId._id), name: product.categoryId.name, slug: product.categoryId.slug } : null,
      }
      return NextResponse.json(mapped)
    }

    const product = findStaticProduct(id)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product)
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