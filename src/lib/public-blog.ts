import 'server-only'
import { cache } from 'react'
import sanitizeHtml from 'sanitize-html'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'
import { publicRead } from '@/lib/public-cache'

const visible = () => ({ $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: new Date() } }] })
class MissingPost extends Error {}
export const getPublicBlogPost = cache(async (slug: string) => {
  try {
    return await publicRead('blog-post', slug, 3600, ['public-blog'], async () => {
      if (!await connectDB()) throw new Error('Blog unavailable')
      const post = await BlogPost.findOne({ slug, ...visible() }).lean()
      // Misses must not hide a scheduled post after its publication time.
      if (!post) throw new MissingPost()
      return { ...post, safeContent: sanitizeHtml(post.content || '', {
        allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, a: ['href', 'name', 'target', 'rel'], img: ['src', 'alt', 'title', 'width', 'height', 'loading'] },
        allowedSchemes: ['http', 'https', 'mailto'],
      }) }
    })
  } catch (error) { if (error instanceof MissingPost) return null; throw error }
})

export const getPublicBlogCategories = cache(async () => publicRead('blog-categories', [], 300, ['public-blog'], async () => {
  if (!await connectDB()) throw new Error('Blog categories unavailable')
  return BlogCategory.find().sort({ name: 1 }).lean()
}))

export async function getPublicBlogRows(options: { categoryId?: unknown; tag?: string; search?: string; page?: number; limit?: number; all?: boolean; excludeId?: unknown }) {
  const { categoryId, tag, search, page = 1, limit = 9, all = false, excludeId } = options
  const load = async () => {
    if (!await connectDB()) throw new Error('Blog archive unavailable')
    const query = { ...visible(), ...(categoryId ? { categories: categoryId } : {}), ...(tag ? { tags: tag } : {}),
      ...(search ? { title: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {}),
      ...(excludeId ? { _id: { $ne: excludeId } } : {}) }
    let request = BlogPost.find(query).select('title slug excerpt featuredImage categories tags taggedProducts author publishedAt updatedAt views')
      .populate('categories', 'name slug').sort({ publishedAt: -1 })
    if (!all) request = request.skip((page - 1) * limit).limit(limit)
    const [posts, total] = await Promise.all([request.lean(), all ? Promise.resolve(0) : BlogPost.countDocuments(query)])
    return { posts, total: all ? posts.length : total }
  }
  return page <= 25 && (search?.length || 0) <= 80
    ? publicRead('blog-list', options, 300, ['public-blog'], load, true) : load()
}
