// src/app/api/admin/tags/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'

// Ensure DB connection
async function ensureDB() {
  if ((await import('mongoose')).default.connection.readyState === 0) {
    await connectDB()
  }
}

// GET: list distinct tags
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureDB()
    const tags = await Product.distinct('tags') as string[]
    return NextResponse.json({ tags })
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
    const { tag } = await request.json()
    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 })
    }
    const existing = await Product.findOne({ tags: tag })
    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    }
    // No product directly uses the tag yet, but we can create a dummy product? Instead, just return success.
    return NextResponse.json({ tag })
  } catch (error) {
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
    const { oldTag, newTag } = await request.json()
    if (!oldTag || !newTag) {
      return NextResponse.json({ error: 'oldTag and newTag are required' }, { status: 400 })
    }
    // Update all products containing oldTag
    await Product.updateMany({ tags: oldTag }, { $addToSet: { tags: newTag }, $pull: { tags: oldTag } })
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
    const { tag } = await request.json()
    if (!tag) {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 })
    }
    await Product.updateMany({ tags: tag }, { $pull: { tags: tag } })
    return NextResponse.json({ deletedTag: tag })
  } catch (error) {
    console.error('DELETE /api/admin/tags error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
