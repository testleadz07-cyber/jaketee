import { invalidateHomeCache } from '@/lib/home-cache'
// src/app/api/admin/tags/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Tag from '@/models/Tag'
import { Types } from 'mongoose'

// Ensure DB connection
async function ensureDB() {
  if ((await import('mongoose')).default.connection.readyState === 0) {
    await connectDB()
  }
}

// GET: list distinct tags
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const categoryId = new URL(request.url).searchParams.get('categoryId')
    if (categoryId !== null && !/^[a-f0-9]{24}$/i.test(categoryId)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    await ensureDB()
    const [registered, usage] = await Promise.all([
      categoryId ? Promise.resolve([]) : Tag.find().lean(),
      Product.aggregate([
        ...(categoryId ? [{ $match: { categoryId: new Types.ObjectId(categoryId) } }] : []),
        { $project: { tags: { $setUnion: [{ $ifNull: ['$tags', []] }, []] } } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
      ]),
    ])
    const counts = new Map<string, number>(usage.map(item => [item._id, item.count]))
    const tags = [...new Set<string>([...registered.map(item => item.name), ...counts.keys()])].sort((a, b) => a.localeCompare(b))
    return NextResponse.json({ tags, usage: tags.map(name => ({ name, productCount: counts.get(name) || 0 })) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('GET /api/admin/tags error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// POST: add a new tag (no duplicate)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureDB()
    const body = await request.json()
    const tag = typeof body.tag === 'string' ? body.tag.trim() : ''
    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 })
    }
    const existing = await Tag.findOne({ name: tag }) || await Product.findOne({ tags: tag })
    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    }
    await Tag.create({ name: tag })
    return NextResponse.json({ tag })
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    console.error('POST /api/admin/tags error:', error)
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 })
  }
}

// PUT: rename a tag (replace oldTag with newTag on all products)
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureDB()
    const body = await request.json()
    const oldTag = typeof body.oldTag === 'string' ? body.oldTag.trim() : ''
    const newTag = typeof body.newTag === 'string' ? body.newTag.trim() : ''
    if (!oldTag || !newTag) {
      return NextResponse.json({ error: 'oldTag and newTag are required' }, { status: 400 })
    }
    if (oldTag === newTag) return NextResponse.json({ oldTag, newTag })
    const exists = await Tag.exists({ name: oldTag }) || await Product.exists({ tags: oldTag })
    if (!exists) return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    if (await Tag.exists({ name: newTag }) || await Product.exists({ tags: newTag })) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    }
    await Tag.updateOne({ name: newTag }, { $setOnInsert: { name: newTag } }, { upsert: true })
    await Product.updateMany({ tags: oldTag }, [{ $set: { tags: { $setUnion: [{ $filter: { input: '$tags', as: 'tag', cond: { $ne: ['$$tag', { $literal: oldTag }] } } }, { $literal: [newTag] }] } } }])
    await Tag.deleteOne({ name: oldTag })
    await invalidateHomeCache()
    return NextResponse.json({ oldTag, newTag })
  } catch (error) {
    console.error('PUT /api/admin/tags error:', error)
    return NextResponse.json({ error: 'Failed to rename tag' }, { status: 500 })
  }
}

// DELETE: remove a tag from all products
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureDB()
    const body = await request.json()
    const tag = typeof body.tag === 'string' ? body.tag.trim() : ''
    if (!tag) {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 })
    }
    await Product.updateMany({ tags: tag }, { $pull: { tags: tag } })
    await Tag.deleteOne({ name: tag })
    await invalidateHomeCache()
    return NextResponse.json({ deletedTag: tag })
  } catch (error) {
    console.error('DELETE /api/admin/tags error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
