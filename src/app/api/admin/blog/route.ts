import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function isAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return null
  return session
}

export async function GET(request: NextRequest) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const query: Record<string, any> = {}
    if (status && ['draft', 'scheduled', 'published'].includes(status)) {
      query.status = status
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }

    const posts = await BlogPost.find(query)
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 })
      .lean()

    const mapped = posts.map((p: any) => ({
      ...p,
      id: String(p._id),
      categories: (p.categories || []).map((c: any) => ({ id: String(c._id), name: c.name, slug: c.slug })),
      taggedProducts: (p.taggedProducts || []).map((id: any) => String(id)),
    }))

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('Admin blog list error:', error)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      categories,
      tags,
      status,
      publishedAt,
      seoTitle,
      seoDescription,
      ogImage,
      taggedProducts,
    } = body

    if (!title || !excerpt || !content) {
      return NextResponse.json({ error: 'Title, excerpt, and content are required' }, { status: 400 })
    }

    const finalSlug = slug ? slugify(slug) : slugify(title)
    const existing = await BlogPost.findOne({ slug: finalSlug })
    if (existing) {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 })
    }

    let finalStatus = status && ['draft', 'scheduled', 'published'].includes(status) ? status : 'draft'
    let finalPublishedAt = publishedAt ? new Date(publishedAt) : undefined

    if (finalStatus === 'scheduled' && (!finalPublishedAt || finalPublishedAt.getTime() <= Date.now())) {
      return NextResponse.json(
        { error: 'A future publish date is required for scheduled posts' },
        { status: 400 }
      )
    }
    if (finalStatus === 'published' && !finalPublishedAt) {
      finalPublishedAt = new Date()
    }

    const post = await BlogPost.create({
      title,
      slug: finalSlug,
      excerpt,
      content,
      featuredImage,
      categories: categories || [],
      tags: tags || [],
      status: finalStatus,
      publishedAt: finalPublishedAt,
      author: { name: session.user?.name || 'Admin', userId: (session.user as any).id },
      seoTitle,
      seoDescription,
      ogImage,
      taggedProducts: taggedProducts || [],
    })

    return NextResponse.json({ ...post.toObject(), id: String(post._id) }, { status: 201 })
  } catch (error: any) {
    console.error('Admin blog create error:', error)
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
  }
}
