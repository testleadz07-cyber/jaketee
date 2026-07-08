import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'

// Public order lookup for guests (and anyone) who know the order number and
// the email address used at checkout. No authentication required - this is
// the only way a guest checkout customer (no account) can check on their
// order status after leaving the confirmation page.
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const orderNumber = typeof body?.orderNumber === 'string' ? body.orderNumber.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    if (!orderNumber || !email) {
      return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 })
    }

    const order = await Order.findOne({
      orderNumber: new RegExp(`^${orderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      userEmail: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).lean()

    if (!order) {
      return NextResponse.json(
        { error: "We couldn't find an order matching that order number and email." },
        { status: 404 }
      )
    }

    // Only return the fields needed to display order status - no need to
    // expose userId or other internal references for a guest lookup.
    const {
      _id,
      orderNumber: on,
      createdAt,
      status,
      total,
      subtotal,
      shipping,
      tax,
      items,
      trackingNumber,
      carrier,
      estimatedDelivery,
      statusHistory,
      shippingAddress,
    } = order as any

    return NextResponse.json({
      id: String(_id),
      orderNumber: on,
      createdAt,
      status,
      total,
      subtotal,
      shipping,
      tax,
      items,
      trackingNumber,
      carrier,
      estimatedDelivery,
      statusHistory,
      shippingAddress,
    })
  } catch (error: any) {
    console.error('Guest order tracking lookup error:', error)
    return NextResponse.json({ error: 'Failed to look up order' }, { status: 500 })
  }
}
