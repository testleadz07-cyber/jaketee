import { getPublicBlogRows, getPublicBlogCategories } from '@/lib/public-blog'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ posts: [], total: 0, page: 1, pages: 0 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') || '9', 10)))
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')

    const now = new Date()
    const query: Record<string, any> = {
      $or: [
        { status: 'published' },
        { status: 'scheduled', publishedAt: { $lte: now } },
      ],
    }

    if (categorySlug) {
      const category = (await getPublicBlogCategories()).find(item => item.slug === categorySlug)
      if (!category) {
        return NextResponse.json({ posts: [], total: 0, page, pages: 0 })
      }
      query.categories = (category as any)._id
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }

    const [{ total, posts }, imageCandidates] = await Promise.all([
      getPublicBlogRows({ categoryId: query.categories, search: search?.trim().slice(0, 200), page, limit }),
      getBlogImageCandidates(),
    ])

    const mapped = posts.map((p: any) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      featuredImage: resolveBlogImage(p, imageCandidates),
      categories: (p.categories || []).map((c: any) => ({ id: String(c._id), name: c.name, slug: c.slug })),
      tags: p.tags,
      author: { name: 'Jacketee Team' },
      publishedAt: p.publishedAt,
      views: p.views,
    }))

    return NextResponse.json({
      posts: mapped,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Public blog list error:', error)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }
}
