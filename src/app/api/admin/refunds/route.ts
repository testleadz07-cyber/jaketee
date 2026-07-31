// src/app/api/admin/refunds/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import RefundRequest from '@/models/RefundRequest'
import { createNotification } from '@/lib/notifications'

// Ensure DB connection helper
async function ensureDB() {
  if ((await import('mongoose')).default.connection.readyState === 0) {
    await connectDB()
  }
}

// GET: list all refund/return requests (optionally filter by status) — admin only
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null
  const search = searchParams.get('search')?.trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
  try {
    await ensureDB()
    const filter: Record<string, any> = status ? { status } : {}
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { orderId: { $regex: escaped, $options: 'i' } },
        { userName: { $regex: escaped, $options: 'i' } },
        { userEmail: { $regex: escaped, $options: 'i' } },
      ]
    }
    const total = await RefundRequest.countDocuments(filter)
    const requests = await RefundRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
    return NextResponse.json({ requests, total, page, pages: Math.max(1, Math.ceil(total / limit)) })
  } catch (error) {
    console.error('GET /api/admin/refunds error:', error)
    return NextResponse.json({ error: 'Failed to fetch refund requests' }, { status: 500 })
  }
}

// POST: submit a new refund/return request — public (no auth required)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, reason, userName, userEmail } = body

    if (!orderId?.trim()) {
      return NextResponse.json({ error: 'Order number is required.' }, { status: 400 })
    }
    if (!reason?.trim() || (reason as string).trim().length < 10) {
      return NextResponse.json({ error: 'Please provide a detailed reason (min 10 characters).' }, { status: 400 })
    }

    await ensureDB()
    const refund = await RefundRequest.create({
      orderId: (orderId as string).trim(),
      reason: (reason as string).trim(),
      status: 'pending',
      ...(userName?.trim() ? { userName: (userName as string).trim() } : {}),
      ...(userEmail?.trim() ? { userEmail: (userEmail as string).trim() } : {}),
    })

    await createNotification({
      type: 'refund_request',
      title: 'New refund/return request',
      message: `Order ${refund.orderId}${refund.userName ? ` from ${refund.userName}` : ''}`,
      link: '/admin/refunds',
    })

    return NextResponse.json({ success: true, id: refund._id }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/refunds error:', error)
    return NextResponse.json({ error: 'Failed to submit request. Please try again.' }, { status: 500 })
  }
}

// PATCH: update status of a request (approve or reject) — admin only
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureDB()
    const { id, status: newStatus } = await request.json()
    if (!id || !['approved', 'rejected'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const updated = await RefundRequest.findByIdAndUpdate(id, { status: newStatus }, { new: true }).lean()
    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    return NextResponse.json({ request: updated })
  } catch (error) {
    console.error('PATCH /api/admin/refunds error:', error)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
