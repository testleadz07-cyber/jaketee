import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })

    const LoginSession = (await import('@/models/LoginSession')).default
    const User = (await import('@/models/User')).default
    const Activity = (await import('@/models/Activity')).default

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const activeThreshold = new Date(now.getTime() - 5 * 60 * 1000) // 5 min

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const [
      totalSessions,
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      activeNow,
    ] = await Promise.all([
      LoginSession.countDocuments({}),
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      LoginSession.countDocuments({
        logoutAt: { $exists: false },
        lastSeenAt: { $gte: activeThreshold },
      }),
    ])

    // Avg session duration (only completed sessions)
    const durationAgg = await LoginSession.aggregate([
      { $match: { durationSeconds: { $exists: true, $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$durationSeconds' }, total: { $sum: '$durationSeconds' } } },
    ])
    const avgDurationSeconds = Math.round(durationAgg[0]?.avg || 0)
    const totalTimeSeconds = durationAgg[0]?.total || 0

    // ── Sessions per day (last 30 days) ───────────────────────────────────────
    const sessionsPerDay = await LoginSession.aggregate([
      { $match: { loginAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$loginAt' },
            month: { $month: '$loginAt' },
            day: { $dayOfMonth: '$loginAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ])

    // ── Top users by session count & total time ───────────────────────────────
    const topUsersBySessions = await LoginSession.aggregate([
      { $match: { loginAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$userId',
          sessionCount: { $sum: 1 },
          totalTimeSeconds: { $sum: { $ifNull: ['$durationSeconds', 0] } },
          lastLogin: { $max: '$loginAt' },
        },
      },
      { $sort: { sessionCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          sessionCount: 1,
          totalTimeSeconds: 1,
          lastLogin: 1,
        },
      },
    ])

    // ── Recent sessions ────────────────────────────────────────────────────────
    const recentSessions = await LoginSession.aggregate([
      { $sort: { loginAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          loginAt: 1,
          logoutAt: 1,
          lastSeenAt: 1,
          durationSeconds: 1,
          ip: 1,
          country: 1,
          userAgent: 1,
          userId: 1,
          userName: '$user.name',
          userEmail: '$user.email',
        },
      },
    ])

    // ── Action breakdown (last 30 days) ───────────────────────────────────────
    const actionBreakdown = await Activity.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ])

    // ── Top countries ─────────────────────────────────────────────────────────
    const topCountries = await LoginSession.aggregate([
      { $match: { country: { $exists: true, $ne: 'Unknown', $ne: 'Localhost', $ne: 'Unknown (Login Event)' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    return NextResponse.json({
      kpis: {
        totalSessions,
        totalUsers,
        newUsersThisWeek,
        newUsersThisMonth,
        activeNow,
        avgDurationSeconds,
        totalTimeSeconds,
      },
      sessionsPerDay: sessionsPerDay.map((d) => ({
        date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
        count: d.count,
      })),
      topUsers: topUsersBySessions.map((u) => ({
        userId: String(u.userId),
        name: u.name,
        email: u.email,
        sessionCount: u.sessionCount,
        totalTimeSeconds: u.totalTimeSeconds,
        lastLogin: u.lastLogin,
      })),
      recentSessions: recentSessions.map((s) => ({
        id: String(s._id),
        userId: String(s.userId),
        userName: s.userName,
        userEmail: s.userEmail,
        loginAt: s.loginAt,
        logoutAt: s.logoutAt || null,
        lastSeenAt: s.lastSeenAt,
        durationSeconds: s.durationSeconds || null,
        ip: s.ip || null,
        country: s.country || 'Unknown',
        userAgent: s.userAgent || null,
        isActive: !s.logoutAt && s.lastSeenAt >= activeThreshold,
      })),
      actionBreakdown: actionBreakdown.map((a) => ({
        action: a._id,
        count: a.count,
      })),
      topCountries: topCountries.map((c) => ({
        country: c._id,
        count: c.count,
      })),
    })
  } catch (error: any) {
    console.error('Admin analytics fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
