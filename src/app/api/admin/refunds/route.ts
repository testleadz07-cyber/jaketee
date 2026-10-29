import { requireAdminApi } from '@/lib/require-admin'
// src/app/api/admin/refunds/route.ts
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import RefundRequest from '@/models/RefundRequest'

// Ensure DB connection helper
async function ensureDB() {
  if ((await import('mongoose')).default.connection.readyState === 0) {
    if (!await connectDB()) throw new Error('Database unavailable')
  }
}

// GET: list all refund/return requests (optionally filter by status) — admin only
export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
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

// Public submissions moved to /api/returns. Keep the old URL admin-protected,
// but do not preserve a second, unverified creation path.
export async function POST() {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  return NextResponse.json({ error: 'Submit return requests through /api/returns' }, { status: 405, headers: { Allow: 'GET, PATCH', 'Cache-Control': 'private, no-store' } })
}

// PATCH: update status of a request (approve or reject) — admin only
export async function PATCH(request: Request) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  try {
    await ensureDB()
    const { id, status: newStatus } = await request.json()
    if (!id || !['approved', 'rejected'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const updated = await RefundRequest.findByIdAndUpdate(id, { status: newStatus }, { returnDocument: 'after' }).lean()
    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    return NextResponse.json({ request: updated })
  } catch (error) {
    console.error('PATCH /api/admin/refunds error:', error)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
