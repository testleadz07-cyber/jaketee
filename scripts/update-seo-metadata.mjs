import 'dotenv/config'
import fs from 'node:fs/promises'
import mongoose from 'mongoose'

const clean = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const atWord = (value, max) => {
  if (value.length <= max) return value
  const part = value.slice(0, max + 1)
  const boundary = part.lastIndexOf(' ')
  return (boundary > max * 0.65 ? part.slice(0, boundary) : part.slice(0, max)).trim()
}
const titleFor = (name, category) => {
  const subject = clean(name).replace(/^custom\s+/i, '')
  const context = clean(category).replace(/\s+collection$/i, '')
  return `${atWord(`Custom ${subject}${context && !subject.toLowerCase().includes(context.toLowerCase().replace(/s$/, '')) ? ` - ${context}` : ''}`, 49)} | Jacketee`
}
const descriptionFor = (name, category) => atWord(
  `Shop ${clean(name)} from our ${clean(category) || 'custom jackets'} collection. Review materials, sizing and customization options, then request a free design mockup before production at Jacketee.`,
  155
)
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const [products, categories, posts] = await Promise.all([
    db.collection('products').find({}).toArray(),
    db.collection('categories').find({}).toArray(),
    db.collection('blogposts').find({ status: { $in: ['published', 'scheduled'] } }).toArray(),
  ])
  const categoriesById = new Map(categories.map((item) => [String(item._id), item]))
  const rows = []
  const usedProductTitles = new Set()

  for (const product of products) {
    const category = categoriesById.get(String(product.categoryId))
    let seoTitle = titleFor(product.name, category?.name)
    if (usedProductTitles.has(seoTitle.toLowerCase())) {
      seoTitle = `${atWord(`${clean(category?.name || 'Jacket')}: ${clean(product.name)}`, 49)} | Jacketee`
    }
    usedProductTitles.add(seoTitle.toLowerCase())
    const seoDescription = descriptionFor(product.name, category?.name)
    await db.collection('products').updateOne({ _id: product._id }, { $set: { seoTitle, seoDescription, updatedAt: new Date() } })
    rows.push({ type: 'Product', url: `/${category?.slug || 'product'}/${product.slug}`, title: seoTitle, description: seoDescription })
  }

  for (const category of categories) {
    const title = atWord(clean(category.seoTitle) || titleFor(category.name, 'Jacket Collection'), 60)
    const description = atWord(clean(category.seoDescription) || descriptionFor(category.name, 'custom jacket'), 155)
    await db.collection('categories').updateOne({ _id: category._id }, { $set: { seoTitle: title, seoDescription: description, updatedAt: new Date() } })
    rows.push({ type: 'Category', url: `/${category.slug}`, title, description })
  }

  for (const post of posts) {
    const title = atWord(clean(post.seoTitle) || `${atWord(clean(post.title), 43)} | Jacketee Blog`, 60)
    const description = atWord(clean(post.seoDescription || post.excerpt) || `Read ${clean(post.title)} for practical guidance on custom jackets, materials, fit and ordering from Jacketee.`, 155)
    await db.collection('blogposts').updateOne({ _id: post._id }, { $set: { seoTitle: title, seoDescription: description, updatedAt: new Date() } })
    rows.push({ type: 'Blog', url: `/blog/${post.slug}`, title, description })
  }

  const duplicateTitles = rows.filter((row, index) => rows.findIndex((candidate) => candidate.title.toLowerCase() === row.title.toLowerCase()) !== index)
  const invalid = rows.filter((row) => !row.title || !row.description || /[\r\n]/.test(row.title + row.description) || row.title.length > 60 || row.description.length > 155)
  if (duplicateTitles.length || invalid.length) {
    console.error({ duplicateTitles: duplicateTitles.map((row) => [row.url, row.title]), invalid: invalid.map((row) => [row.url, row.title.length, row.description.length]) })
    throw new Error(`Metadata validation failed: ${duplicateTitles.length} duplicate titles, ${invalid.length} invalid rows`)
  }

  const header = ['Type', 'URL', 'Title', 'Title length', 'Description', 'Description length']
  const lines = [header.map(csv).join(','), ...rows.sort((a, b) => a.url.localeCompare(b.url)).map((row) => [row.type, row.url, row.title, row.title.length, row.description, row.description.length].map(csv).join(','))]
  await fs.writeFile('docs/metadata-report.csv', `${lines.join('\n')}\n`, 'utf8')
  console.log(`Updated ${products.length} products, ${categories.length} categories and ${posts.length} blog posts.`)
  console.log(`Wrote ${rows.length} rows to docs/metadata-report.csv.`)
  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await mongoose.disconnect().catch(() => undefined)
  process.exit(1)
})
