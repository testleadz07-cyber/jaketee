import 'dotenv/config'
import { connectDB } from '../src/lib/mongodb'
import BlogPost from '../src/models/BlogPost'
import BlogCategory from '../src/models/BlogCategory'

function sanitize(text: string): string {
  return text
    .replace(/https?:\/\/(?:www\.)?jacketee\.com/gi, '')
    .replace(/\bjacketee\.com\b/gi, '')
    .replace(/\bjacketee\b/gi, 'Jacketee')
}

function containsJacketee(text?: string | null): boolean {
  return !!text && /jacketee/i.test(text)
}

async function main() {
  const db = await connectDB()
  if (!db) {
    console.error('Could not connect to the database.')
    process.exit(1)
  }

  let postsChanged = 0
  const unresolvedImageUrls: string[] = []

  const posts = await BlogPost.find({})
  for (const post of posts) {
    let changed = false
    const before = JSON.stringify({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      authorName: post.author?.name,
      tags: post.tags,
    })

    if (containsJacketee(post.title)) { post.title = sanitize(post.title); changed = true }
    if (containsJacketee(post.excerpt)) { post.excerpt = sanitize(post.excerpt); changed = true }
    if (containsJacketee(post.content)) { post.content = sanitize(post.content); changed = true }
    if (containsJacketee(post.seoTitle)) { post.seoTitle = sanitize(post.seoTitle!); changed = true }
    if (containsJacketee(post.seoDescription)) { post.seoDescription = sanitize(post.seoDescription!); changed = true }
    if (containsJacketee(post.author?.name)) { post.author.name = sanitize(post.author.name); changed = true }
    if (post.tags?.some((t: string) => containsJacketee(t))) {
      post.tags = post.tags.map((t: string) => sanitize(t))
      changed = true
    }

    if (containsJacketee(post.featuredImage) || containsJacketee(post.ogImage)) {
      unresolvedImageUrls.push(`${post.slug} -> ${post.featuredImage || post.ogImage}`)
    }

    if (changed) {
      const after = JSON.stringify({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        authorName: post.author?.name,
        tags: post.tags,
      })
      if (before !== after) {
        await post.save()
        postsChanged++
        console.log(`Updated: ${post.slug}`)
      }
    }
  }

  let categoriesChanged = 0
  const categories = await BlogCategory.find({})
  for (const category of categories) {
    let changed = false
    if (containsJacketee(category.name)) { category.name = sanitize(category.name); changed = true }
    if (containsJacketee(category.description)) { category.description = sanitize(category.description!); changed = true }
    if (changed) {
      await category.save()
      categoriesChanged++
      console.log(`Updated category: ${category.slug}`)
    }
  }

  console.log(`\nDone. Posts updated: ${postsChanged}. Categories updated: ${categoriesChanged}.`)

  if (unresolvedImageUrls.length) {
    console.log(`\n${unresolvedImageUrls.length} post(s) have a featuredImage/ogImage URL containing "jacketee" that could NOT be auto-fixed (it's a real hosted Cloudinary/asset URL — renaming the substring would break the image link). Re-upload a replacement image via the admin blog editor if you want these fully de-branded:`)
    unresolvedImageUrls.forEach((line) => console.log(`  - ${line}`))
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
