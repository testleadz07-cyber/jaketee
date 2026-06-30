import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const order = await Order.findById(id).lean()
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const userRole = (session.user as any).role
    const currentUserId = (session.user as any).id
    const orderUserId = (order as any).userId ? String((order as any).userId) : ''

    if (userRole !== 'admin' && orderUserId !== String(currentUserId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ ...order, id: String((order as any)._id) })
  } catch (error: any) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const { status, trackingNumber, carrier, estimatedDelivery, note } = body

    const validStatuses = ['pending', 'paid', 'shipped', 'in_transit', 'delivered', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const validCarriers = ['UPS', 'FedEx', 'USPS', 'DHL', 'Other']
    if (carrier && !validCarriers.includes(carrier)) {
      return NextResponse.json({ error: 'Invalid carrier' }, { status: 400 })
    }

    const existingOrder = await Order.findById(id)
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const update: Record<string, any> = {}
    if (status) update.status = status
    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber
    if (carrier !== undefined) update.carrier = carrier
    if (estimatedDelivery !== undefined) {
      update.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : undefined
    }

    if (status && status !== existingOrder.status) {
      update.$push = {
        statusHistory: {
          status,
          timestamp: new Date(),
          note: note || undefined,
        },
      }
    }

    const { $push, ...setFields } = update
    const updateQuery: Record<string, any> = { $set: setFields }
    if ($push) {
      updateQuery.$push = $push
    }

    const order = await Order.findByIdAndUpdate(id, updateQuery, { new: true }).lean()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ ...order, id: String((order as any)._id) })
  } catch (error: any) {
    console.error('Order status update error:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
