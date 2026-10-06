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
    const guestId = searchParams.get('guestId')
    
    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 })
    }

    const activities = await GuestActivity.find({ guestId }).sort({ createdAt: 1 }).lean()

    const actionCounts: Record<string, number> = {}
    const pageCounts: Record<string, number> = {}
    const timelineData: Record<string, number> = {}
    const uniqueDays = new Set<string>()
    let firstSeen: Date | null = null as Date | null
    let lastSeen: Date | null = null as Date | null
    const countriesSet = new Set<string>()

    activities.forEach((a: any) => {
      // Actions
      actionCounts[a.action] = (actionCounts[a.action] || 0) + 1
      
      // Pages
      const page = a.details?.path || a.details?.url || a.details?.page || 'Unknown'
      pageCounts[page] = (pageCounts[page] || 0) + 1
      
      // Timeline
      const dateObj = new Date(a.createdAt)
      const dateStr = dateObj.toISOString().split('T')[0]
      timelineData[dateStr] = (timelineData[dateStr] || 0) + 1
      uniqueDays.add(dateStr)

      // First/Last seen
      if (!firstSeen || dateObj < firstSeen) firstSeen = dateObj
      if (!lastSeen || dateObj > lastSeen) lastSeen = dateObj

      // Countries
      if (a.country) countriesSet.add(a.country)
    })

    const actions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    const pages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }))
    
    const timeline = Object.entries(timelineData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      actions,
      pages,
      timeline,
      totalActivities: activities.length,
      uniqueActions: Object.keys(actionCounts).length,
      uniquePages: Object.keys(pageCounts).length,
      uniqueDays: uniqueDays.size,
      firstSeen: firstSeen?.toISOString() || null,
      lastSeen: lastSeen?.toISOString() || null,
      countries: Array.from(countriesSet),
    })
  } catch (error: any) {
    console.error('Admin guest activity stats fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch guest activity stats' }, { status: 500 })
  }
}
