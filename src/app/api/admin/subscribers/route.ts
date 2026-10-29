import { requireAdminApi } from '@/lib/require-admin'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Subscriber from '@/models/Subscriber'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi()
    if (auth.response) return auth.response

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    const query: Record<string, any> = {}
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.email = { $regex: escaped, $options: 'i' }
    }

    const [total, subscribers] = await Promise.all([
      Subscriber.countDocuments(query),
      Subscriber.find(query)
        .sort({ subscribedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])

    return NextResponse.json({
      subscribers: subscribers.map((s: any) => ({
        id: String(s._id),
        email: s.email,
        subscribedAt: s.subscribedAt,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error: any) {
    console.error('Admin subscribers fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminApi()
    if (auth.response) return auth.response

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Subscriber id is required' }, { status: 400 })
    }

    const deleted = await Subscriber.findByIdAndDelete(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin subscribers delete error:', error)
    return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 })
  }
}
