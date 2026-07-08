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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const post = await BlogPost.findById(id).populate('categories', 'name slug').lean()
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const p: any = post
    return NextResponse.json({
      ...p,
      id: String(p._id),
      categories: (p.categories || []).map((c: any) => ({ id: String(c._id), name: c.name, slug: c.slug })),
      taggedProducts: (p.taggedProducts || []).map((tid: any) => String(tid)),
    })
  } catch (error: any) {
    console.error('Admin blog fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const update: Record<string, any> = {}

    const directFields = [
      'title',
      'excerpt',
      'content',
      'featuredImage',
      'categories',
      'tags',
      'seoTitle',
      'seoDescription',
      'ogImage',
      'taggedProducts',
    ]
    for (const field of directFields) {
      if (body[field] !== undefined) update[field] = body[field]
    }

    if (body.slug) {
      const finalSlug = slugify(body.slug)
      const existing = await BlogPost.findOne({ slug: finalSlug, _id: { $ne: id } })
      if (existing) {
        return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 })
      }
      update.slug = finalSlug
    }

    if (body.status !== undefined) {
      if (!['draft', 'scheduled', 'published'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      update.status = body.status

      if (body.status === 'scheduled') {
        const publishedAt = body.publishedAt ? new Date(body.publishedAt) : null
        if (!publishedAt || publishedAt.getTime() <= Date.now()) {
          return NextResponse.json(
            { error: 'A future publish date is required for scheduled posts' },
            { status: 400 }
          )
        }
        update.publishedAt = publishedAt
      } else if (body.status === 'published') {
        update.publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date()
      }
    } else if (body.publishedAt !== undefined) {
      update.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined
    }

    const post = await BlogPost.findByIdAndUpdate(id, update, { new: true }).populate(
      'categories',
      'name slug'
    )
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ ...post.toObject(), id: String(post._id) })
  } catch (error: any) {
    console.error('Admin blog update error:', error)
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const post = await BlogPost.findByIdAndDelete(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin blog delete error:', error)
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })
  }
}
