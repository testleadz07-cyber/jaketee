import { requireAdminApi } from '@/lib/require-admin'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi()
    if (auth.response) return auth.response

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })

    const LoginSession = (await import('@/models/LoginSession')).default
    const activeThreshold = new Date(Date.now() - 5 * 60 * 1000)

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = 20

    const total = await LoginSession.countDocuments({ userId: id })
    const sessions = await LoginSession.find({ userId: id })
      .select('_id loginAt logoutAt lastSeenAt durationSeconds ip country userAgent')
      .sort({ loginAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Aggregate summary stats for this user
    const stats = await LoginSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalTimeSeconds: { $sum: { $ifNull: ['$durationSeconds', 0] } },
          avgDurationSeconds: { $avg: { $ifNull: ['$durationSeconds', 0] } },
          lastLogin: { $max: '$loginAt' },
        },
      },
    ])
    const summary = stats[0] || {
      totalSessions: 0,
      totalTimeSeconds: 0,
      avgDurationSeconds: 0,
      lastLogin: null,
    }

    return NextResponse.json({
      sessions: sessions.map((s: any) => ({
        id: String(s._id),
        loginAt: s.loginAt,
        logoutAt: s.logoutAt || null,
        lastSeenAt: s.lastSeenAt,
        durationSeconds: s.durationSeconds || null,
        ip: s.ip || null,
        country: s.country || 'Unknown',
        userAgent: s.userAgent || null,
        isActive: !s.logoutAt && new Date(s.lastSeenAt) >= activeThreshold,
      })),
      summary: {
        totalSessions: summary.totalSessions,
        totalTimeSeconds: Math.round(summary.totalTimeSeconds),
        avgDurationSeconds: Math.round(summary.avgDurationSeconds || 0),
        lastLogin: summary.lastLogin,
      },
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error: any) {
    console.error('User sessions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
