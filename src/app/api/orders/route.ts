import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const userIdQuery = searchParams.get('userId')
    const statusQuery = searchParams.get('status')
    const search = searchParams.get('search')?.trim()
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    const userRole = (session.user as any).role
    const currentUserId = (session.user as any).id

    let query: any = {}

    if (userRole === 'admin') {
      if (userIdQuery) {
        query.userId = userIdQuery
      }
      if (statusQuery) {
        query.status = statusQuery
      }
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        query.$or = [
          { orderNumber: { $regex: escaped, $options: 'i' } },
          { userName: { $regex: escaped, $options: 'i' } },
          { userEmail: { $regex: escaped, $options: 'i' } },
        ]
      }
    } else {
      query.userId = currentUserId
      if (statusQuery) {
        query.status = statusQuery
      }
    }

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || '20', 10) || 20))
      const total = await Order.countDocuments(query)
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
      return NextResponse.json(orders, {
        headers: { 'X-Total-Count': String(total), 'X-Page': String(page), 'X-Pages': String(Math.max(1, Math.ceil(total / limit))) },
      })
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean()
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
