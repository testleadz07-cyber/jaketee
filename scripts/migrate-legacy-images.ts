import 'dotenv/config'
import { MongoClient } from 'mongodb'

const SOURCE_DB = 'clothoo_next_store'
const TARGET_DB = 'test'
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not configured')
}

function normalize(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeImageUrl(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/clothaa|clothoo/gi, 'jacketee')
    : ''
}

function uniqueImages(values: unknown[]): string[] {
  return Array.from(new Set(values.map(normalizeImageUrl).filter(Boolean)))
}

async function migrateProducts(source: any, target: any) {
  const sourceProducts = await source.collection('products').find({}).toArray()
  const targetProducts = await target.collection('products').find({}).toArray()
  const byKey = new Map(sourceProducts.map((product: any) => [normalize(product.slug || product.name), product]))
  let matched = 0
  let updated = 0
  let skipped = 0

  for (const product of targetProducts) {
    const sourceProduct = byKey.get(normalize(product.slug || product.name))
    if (!sourceProduct) {
      skipped++
      continue
    }

    matched++
    const urls = uniqueImages([sourceProduct.image, ...(Array.isArray(sourceProduct.images) ? sourceProduct.images : [])])
    if (!urls.length) continue

    const images = urls.map((url, order) => ({
      url,
      alt: product.name || sourceProduct.name || '',
      order,
    }))
    await target.collection('products').updateOne(
      { _id: product._id },
      { $set: { images } }
    )
    updated++
  }

  return { matched, updated, skipped }
}

async function migrateFaqs(source: any, target: any) {
  const sourceFaqs = await source.collection('faqs').find({}).toArray()
  const targetFaqs = await target.collection('faqs').find({}).toArray()
  const byQuestion = new Map(sourceFaqs.map((faq: any) => [normalize(faq.question), faq]))
  let matched = 0
  let updated = 0
  let skipped = 0

  for (const faq of targetFaqs) {
    const sourceFaq = byQuestion.get(normalize(faq.question))
    const src = normalizeImageUrl(sourceFaq?.image?.src)
    if (!sourceFaq) {
      skipped++
      continue
    }
    matched++
    if (!src) continue

    await target.collection('faqs').updateOne(
      { _id: faq._id },
      { $set: { image: { src, alt: sourceFaq.image?.alt || '' } } }
    )
    updated++
  }

  return { matched, updated, skipped }
}

async function migrateCategories(source: any, target: any) {
  const sourceCategories = await source.collection('categories').find({}).toArray()
  const targetCategories = await target.collection('categories').find({}).toArray()
  const byKey = new Map(sourceCategories.map((category: any) => [normalize(category.slug || category.name), category]))
  let matched = 0
  let updated = 0
  let skipped = 0

  for (const category of targetCategories) {
    const sourceCategory = byKey.get(normalize(category.slug || category.name))
    const image = normalizeImageUrl(sourceCategory?.image)
    if (!sourceCategory) {
      skipped++
      continue
    }
    matched++
    if (!image) continue

    await target.collection('categories').updateOne(
      { _id: category._id },
      { $set: { image } }
    )
    updated++
  }

  return { matched, updated, skipped }
}

async function migrateBlogs(source: any, target: any) {
  const sourceBlogs = await source.collection('blogs').find({}).toArray()
  const targetPosts = await target.collection('blogposts').find({}).toArray()
  const byKey = new Map(sourceBlogs.map((blog: any) => [normalize(blog.slug || blog.title), blog]))
  let matched = 0
  let updated = 0
  let skipped = 0

  for (const post of targetPosts) {
    const sourceBlog = byKey.get(normalize(post.slug || post.title))
    const featuredImage = normalizeImageUrl(sourceBlog?.coverImage)
    if (!sourceBlog) {
      skipped++
      continue
    }
    matched++
    if (!featuredImage) continue

    const update: Record<string, string> = { featuredImage }
    if (sourceBlog.ogImage) update.ogImage = normalizeImageUrl(sourceBlog.ogImage)
    await target.collection('blogposts').updateOne({ _id: post._id }, { $set: update })
    updated++
  }

  return { matched, updated, skipped }
}

async function main() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  try {
    const source = client.db(SOURCE_DB)
    const target = client.db(TARGET_DB)
    console.log(`Migrating images from ${SOURCE_DB} to ${TARGET_DB}...`)
    console.log('Only matched records are updated; unmatched records are left unchanged.')

    const results = {
      products: await migrateProducts(source, target),
      faqs: await migrateFaqs(source, target),
      categories: await migrateCategories(source, target),
      blogposts: await migrateBlogs(source, target),
    }

    console.log(JSON.stringify(results, null, 2))
    console.log('Image migration complete.')
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error('Image migration failed:', error)
  process.exit(1)
})
