import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import GuestActivity from '@/models/GuestActivity'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'all'
    const country = searchParams.get('country')?.trim() || ''
    const guestId = searchParams.get('guestId')?.trim() || ''
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    const query: Record<string, any> = {}
    if (action !== 'all') {
      query.action = action
    }
    if (country) {
      query.country = { $regex: country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    }
    if (guestId) {
      query.guestId = guestId
    }
    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = new Date(from)
      if (to) query.createdAt.$lte = new Date(to)
    }

    const total = await GuestActivity.countDocuments(query)
    const activities = await GuestActivity.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const distinctActions = await GuestActivity.distinct('action')

    return NextResponse.json({
      activities: activities.map((a: any) => ({
        id: String(a._id),
        guestId: a.guestId,
        action: a.action,
        details: a.details,
        ip: a.ip,
        userAgent: a.userAgent,
        country: a.country,
        createdAt: a.createdAt,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      actions: distinctActions,
    })
  } catch (error: any) {
    console.error('Admin guest activity fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch guest activity' }, { status: 500 })
  }
}
