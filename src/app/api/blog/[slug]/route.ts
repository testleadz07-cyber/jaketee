import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import '@/models/Product'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const now = new Date()
    const post = await BlogPost.findOneAndUpdate(
      {
        slug,
        $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
      },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('categories', 'name slug')
      .populate('taggedProducts', 'name slug price compareAtPrice images averageRating')
      .lean()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const p: any = post

    // Related posts: same category, excluding this post
    const categoryIds = (p.categories || []).map((c: any) => c._id)
    const related = categoryIds.length
      ? await BlogPost.find({
          _id: { $ne: p._id },
          categories: { $in: categoryIds },
          $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
        })
          .select('title slug excerpt featuredImage publishedAt')
          .sort({ publishedAt: -1 })
          .limit(3)
          .lean()
      : []

    return NextResponse.json({
      ...p,
      id: String(p._id),
      categories: (p.categories || []).map((c: any) => ({ id: String(c._id), name: c.name, slug: c.slug })),
      taggedProducts: (p.taggedProducts || []).map((tp: any) => ({
        id: String(tp._id),
        name: tp.name,
        slug: tp.slug,
        price: tp.price,
        compareAtPrice: tp.compareAtPrice,
        thumbnail: tp.images?.[0]?.url || null,
        averageRating: tp.averageRating,
      })),
      relatedPosts: related.map((r: any) => ({
        id: String(r._id),
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        featuredImage: r.featuredImage,
        publishedAt: r.publishedAt,
      })),
    })
  } catch (error: any) {
    console.error('Public blog detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 })
  }
}
