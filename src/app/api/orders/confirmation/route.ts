import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'

export async function POST(request: NextRequest) {
  try {
    const { orderId, email } = await request.json()
    if (typeof orderId !== 'string' || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Order reference and email are required' }, { status: 400 })
    }
    if (!(await connectDB())) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }
    const [session, order] = await Promise.all([
      getServerSession(authOptions),
      Order.findById(orderId).lean().catch(() => null),
    ])
    const isOwner = order?.userId && String(order.userId) === String((session?.user as any)?.id || '')
    const isGuest = !order?.userId && order?.userEmail?.toLowerCase() === email.trim().toLowerCase()
    if (!order || (!isOwner && !isGuest) || order.status !== 'paid') {
      return NextResponse.json({ error: 'Confirmed order not found' }, { status: 404 })
    }
    const { userId, ...safeOrder } = order
    return NextResponse.json(safeOrder, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Order confirmation lookup failed:', error)
    return NextResponse.json({ error: 'Could not retrieve order confirmation' }, { status: 500 })
  }
}
