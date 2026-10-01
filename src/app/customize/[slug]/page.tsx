import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import mongoose from 'mongoose'
import { CustomizeProductView } from '@/components/customize-product-view'
import type { ProductDetailData } from '@/components/product-detail-view'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { resolveAncestorChain } from '@/lib/categories'
import { pageMetaDescription, socialImageUrl } from '@/lib/seo-metadata'

interface Props {
  params: Promise<{ slug: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'

async function getCustomizeProduct(slug: string): Promise<ProductDetailData | null> {
  const db = await connectDB()
  if (!db) return null

  let product: any = null
  if (mongoose.Types.ObjectId.isValid(slug)) {
    product = await Product.findById(slug).populate('categoryId', 'name slug').lean()
  }
  if (!product) {
    product = await Product.findOne({ slug }).populate('categoryId', 'name slug').lean()
  }
  if (!product) return null

  let categoryPath: { name: string; slug: string }[] = []
  if (product.categoryId) {
    const allCategories = await Category.find().lean()
    const categoryChainNodes = allCategories.map((category: any) => ({
      _id: String(category._id),
      parentId: category.parentId ? String(category.parentId) : null,
      name: category.name,
      slug: category.slug,
    }))
    categoryPath = resolveAncestorChain(categoryChainNodes, String((product.categoryId as any)._id)).map(
      (category) => ({ name: category.name, slug: category.slug })
    )
  }

  return {
    id: String(product._id || product.id),
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    specificationDetails: product.specificationDetails || undefined,
    careInstructions: product.careInstructions || undefined,
    price: Number(product.price || 0),
    compareAtPrice: product.compareAtPrice == null ? null : Number(product.compareAtPrice),
    compareAtPriceVerified: Boolean(product.compareAtPriceVerified),
    inStock: Boolean(product.inStock),
    isFeatured: Boolean(product.isFeatured),
    category: categoryPath.at(-1) || { name: product.categoryId?.name || 'Shop', slug: product.categoryId?.slug || 'shop' },
    categoryPath,
    images: (product.images || []).map((image: any, index: number) => ({
      id: String(image.id || image._id || index),
      url: image.url,
      alt: image.alt || null,
      order: Number(image.order ?? index),
    })),
    variants: (product.variants || []).map((variant: any, index: number) => ({
      id: String(variant.id || variant._id || index),
      name: variant.name,
      value: variant.value,
      priceAdjust: Number(variant.priceAdjust || 0),
      inStock: Boolean(variant.inStock),
      image: variant.image || null,
    })),
    embroidery: product.embroidery ? {
      available: Boolean(product.embroidery.available),
      fee: Number(product.embroidery.fee || 0),
      maxChars: Number(product.embroidery.maxChars || 20),
    } : undefined,
    measurementFields: product.measurementFields || [],
    stockCount: Number(product.stockCount || 0),
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getCustomizeProduct(slug)
  if (!product) {
    return {
      title: 'Customize Jacket - Jacketee',
      description: 'Create a custom jacket design with Jacketee.',
    }
  }

  const title = `Customize ${product.name} - Jacketee`
  const description = pageMetaDescription(
    product.description,
    `Customize ${product.name} with embroidery, artwork, sizing, and jacket options.`
  )
  const imageUrl = socialImageUrl(product.images?.[0]?.url)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/customize/${product.slug}` },
    openGraph: { title, description, images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }], url: `${SITE_URL}/customize/${product.slug}` },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  }
}

export default async function CustomizePage({ params }: Props) {
  const { slug } = await params
  const product = await getCustomizeProduct(slug)
  if (!product) notFound()

  return <CustomizeProductView product={product} />
}
