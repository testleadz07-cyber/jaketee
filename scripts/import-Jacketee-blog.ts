import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { marked } from 'marked'
import { connectDB } from '../src/lib/mongodb'
import BlogPost from '../src/models/BlogPost'
import BlogCategory from '../src/models/BlogCategory'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

interface SourcePost {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  authorName?: string
  category?: string
  tags?: string[]
  status?: string
  seoTitle?: string
  seoDescription?: string
  publishedAt?: string
}

async function main() {
  const dataPath = path.join(__dirname, 'data', 'jacketee-blog-import.json')
  if (!fs.existsSync(dataPath)) {
    console.error(`Missing ${dataPath} — save the full JSON array there first.`)
    process.exit(1)
  }

  const posts: SourcePost[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  console.log(`Loaded ${posts.length} posts from ${dataPath}`)

  const db = await connectDB()
  if (!db) {
    console.error('Could not connect to the database.')
    process.exit(1)
  }

  const categoryCache = new Map<string, string>()
  async function resolveCategoryId(name: string): Promise<string> {
    if (categoryCache.has(name)) return categoryCache.get(name)!
    const slug = slugify(name)
    const category = await BlogCategory.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug } },
      { upsert: true, new: true }
    )
    categoryCache.set(name, String(category._id))
    return String(category._id)
  }

  const unresolvedImages: string[] = []
  let created = 0
  let updated = 0

  for (const p of posts) {
    const finalSlug = slugify(p.slug || p.title)
    const categoryId = p.category ? await resolveCategoryId(p.category) : null

    const finalStatus = p.status === 'published' ? 'published' : 'draft'
    const publishedAt = p.publishedAt ? new Date(p.publishedAt) : finalStatus === 'published' ? new Date() : undefined

    const isUsableImage = !!p.coverImage && /^https?:\/\//.test(p.coverImage)
    if (p.coverImage && !isUsableImage) {
      unresolvedImages.push(`${finalSlug} -> ${p.coverImage}`)
    }

    const contentHtml = await marked.parse(p.content || '')

    const result = await BlogPost.findOneAndUpdate(
      { slug: finalSlug },
      {
        $set: {
          title: p.title,
          slug: finalSlug,
          excerpt: p.excerpt,
          content: contentHtml,
          featuredImage: isUsableImage ? p.coverImage : undefined,
          categories: categoryId ? [categoryId] : [],
          tags: p.tags || [],
          status: finalStatus,
          publishedAt,
          author: { name: p.authorName || 'Jacketee Team' },
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
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
  if (unresolvedImages.length) {
    console.log(`\n${unresolvedImages.length} post(s) have a coverImage that won't resolve on our domain (relative Jacketee asset paths) — featuredImage left empty, needs a manual upload via the admin blog editor:`)
    unresolvedImages.forEach((line) => console.log(`  - ${line}`))
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
