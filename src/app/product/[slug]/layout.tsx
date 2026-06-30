import { Metadata } from 'next'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import { findStaticProduct } from '@/lib/static-data'
import mongoose from 'mongoose'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  let product: any = null

  try {
    const db = await connectDB()
    if (db) {
      if (mongoose.Types.ObjectId.isValid(slug)) {
        product = await Product.findById(slug).populate('categoryId', 'name slug').lean()
      }
      if (!product) {
        product = await Product.findOne({ slug: slug }).populate('categoryId', 'name slug').lean()
      }
    }
  } catch (error) {
    console.error('Error fetching product for metadata:', error)
  }

  if (!product) {
    product = findStaticProduct(slug)
  }

  if (!product) {
    return {
      title: 'Product Not Found - LUXE STORE',
      description: 'The requested product could not be found.',
    }
  }

  const title = `${product.name} - LUXE STORE`
  const description = product.description.slice(0, 160)
  const imageUrl = product.images?.[0]?.url || 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
