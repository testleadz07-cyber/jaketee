import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'

async function isAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return null
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
    const status = searchParams.get('status') || 'all' // 'all' | 'unread' | 'read'
    const search = searchParams.get('search')?.trim() || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    const query: Record<string, any> = {}
    if (status === 'unread') query.read = false
    else if (status === 'read') query.read = true
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { subject: { $regex: escaped, $options: 'i' } },
        { message: { $regex: escaped, $options: 'i' } },
      ]
    }

    const [total, unreadCount, messages] = await Promise.all([
      ContactMessage.countDocuments(query),
      ContactMessage.countDocuments({ read: false }),
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])

    return NextResponse.json({
      messages: messages.map((m: any) => ({
        id: String(m._id),
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        read: m.read,
        createdAt: m.createdAt,
      })),
      total,
      unreadCount,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error: any) {
    console.error('Admin contact messages fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact messages' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    const { id, read } = body

    if (!id || typeof read !== 'boolean') {
      return NextResponse.json({ error: 'Missing id or read flag' }, { status: 400 })
    }

    const updated = await ContactMessage.findByIdAndUpdate(id, { read }, { new: true }).lean()
    if (!updated) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin contact messages update error:', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Message id is required' }, { status: 400 })
    }

    const deleted = await ContactMessage.findByIdAndDelete(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin contact messages delete error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
