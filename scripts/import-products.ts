import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { connectDB } from '../src/lib/mongodb'
import Product from '../src/models/Product'
import Category from '../src/models/Category'

interface SourceProduct {
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  image?: string
  images?: string[]
  category: string
  subCategory?: string
  inStock?: boolean
  stockCount?: number
  rating?: number
  reviewCount?: number
  tags?: string[]
}

function stripBranding(text: string) {
  return text.replace(/Jacketee/g, 'Jacketee').replace(/jacketee/g, 'Jacketee')
}

function titleCase(slug: string) {
  return slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
}

async function main() {
  const dataPath = path.join(__dirname, 'data', 'products-import.json')
  if (!fs.existsSync(dataPath)) {
    console.error(`Missing ${dataPath}`)
    process.exit(1)
  }

  const products: SourceProduct[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  console.log(`Loaded ${products.length} products from ${dataPath}`)

  const db = await connectDB()
  if (!db) {
    console.error('Could not connect to the database.')
    process.exit(1)
  }

  const categoryCache = new Map<string, string>()
  async function resolveCategoryId(slug: string): Promise<string> {
    if (categoryCache.has(slug)) return categoryCache.get(slug)!
    const category = await Category.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name: titleCase(slug), slug } },
      { upsert: true, new: true }
    )
    categoryCache.set(slug, String(category._id))
    return String(category._id)
  }

  let created = 0
  let updated = 0

  for (const p of products) {
    const categoryId = await resolveCategoryId(p.category)

    const allImageUrls = [p.image, ...(p.images || [])].filter((u): u is string => !!u)
    const uniqueImageUrls = Array.from(new Set(allImageUrls))
    const images = uniqueImageUrls.map((url, order) => ({
      url,
      alt: stripBranding(p.name),
      order,
    }))

    const compareAtPrice =
      p.originalPrice && p.originalPrice > p.price ? p.originalPrice : undefined

    const result = await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: stripBranding(p.name),
          slug: p.slug,
          description: stripBranding(p.description),
          price: p.price,
          compareAtPrice,
          categoryId,
          images,
          averageRating: p.rating ?? 0,
          reviewCount: p.reviewCount ?? 0,
          inStock: p.inStock ?? true,
          stockCount: p.stockCount ?? 100,
          tags: p.tags || [],
        },
      },
      { upsert: true, new: true, rawResult: true }
    )

    if (result.lastErrorObject?.updatedExisting) {
      updated++
    } else {
      created++
    }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
