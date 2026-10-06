import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  await connectDB()
  
  // Find the category by slug
  const category = await Category.findOne({ slug }).lean()
  
  if (!category) {
    return NextResponse.redirect(new URL('/shop', request.url))
  }
  
  // Find the first active product in this category
  const product = await Product.findOne({ 
    categoryId: category._id,
    status: 'active',
    isDraft: { $ne: true }
  }).lean()
  
  if (product) {
    return NextResponse.redirect(new URL(`/customize/${product.slug || product._id}`, request.url))
  }
  
  // Fallback if no product found in this specific category, try finding any product
  const anyProduct = await Product.findOne({ 
    status: 'active',
    isDraft: { $ne: true }
  }).lean()

  if (anyProduct) {
    return NextResponse.redirect(new URL(`/customize/${anyProduct.slug || anyProduct._id}`, request.url))
  }
  
  return NextResponse.redirect(new URL('/shop', request.url))
}
