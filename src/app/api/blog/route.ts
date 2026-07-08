import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'

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
      const category = await BlogCategory.findOne({ slug: categorySlug }).lean()
      if (!category) {
        return NextResponse.json({ posts: [], total: 0, page, pages: 0 })
      }
      query.categories = (category as any)._id
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }

    const total = await BlogPost.countDocuments(query)
    const posts = await BlogPost.find(query)
      .populate('categories', 'name slug')
      .select('-content')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const mapped = posts.map((p: any) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      featuredImage: p.featuredImage,
      categories: (p.categories || []).map((c: any) => ({ id: String(c._id), name: c.name, slug: c.slug })),
      tags: p.tags,
      author: p.author,
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
