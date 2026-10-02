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
    for (const field of ['userName', 'userEmail', 'notes'] as const) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'string' || (field !== 'notes' && !body[field].trim())) {
          return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
        }
        update[field] = body[field].trim()
      }
    }
    if (body.userEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.userEmail.trim())) {
      return NextResponse.json({ error: 'Invalid customer email' }, { status: 400 })
    }
    if (body.userId !== undefined) update.userId = body.userId
    for (const [field, allowed] of Object.entries({
      paymentMethod: ['paypal', 'stripe', 'cash', 'bank_transfer', 'other'],
      paymentStatus: ['unpaid', 'paid', 'partially_paid'],
    })) {
      if (body[field] !== undefined) {
        if (!allowed.includes(body[field])) return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
        update[field] = body[field]
      }
    }
    if (body.shippingAddress !== undefined) {
      const address = body.shippingAddress
      const fields = ['name', 'street', 'city', 'state', 'zip', 'country']
      if (!address || fields.some(field => typeof address[field] !== 'string' || !address[field].trim()) ||
          (address.phone !== undefined && typeof address.phone !== 'string')) {
        return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 })
      }
      update.shippingAddress = Object.fromEntries([...fields, 'phone'].map(field => [field, address[field]?.trim() || '']))
    }
    if (body.items !== undefined) {
      if (!Array.isArray(body.items) || !body.items.length || body.items.some((item: any) =>
        !item || typeof item.name !== 'string' || !item.name.trim() ||
        typeof item.productId !== 'string' || !item.productId || typeof item.image !== 'string' || !item.image ||
        typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0 ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1)) {
        return NextResponse.json({ error: 'Invalid order items' }, { status: 400 })
      }
      update.items = body.items.map((item: any) => ({
        productId: item.productId, name: item.name.trim(), image: item.image,
        price: item.price, quantity: item.quantity, variants: item.variants || [],
        customization: item.customization,
      }))
    }
    for (const field of ['shipping', 'tax']) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'number' || !Number.isFinite(body[field]) || body[field] < 0) {
          return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
        }
        update[field] = body[field]
      }
    }
    if (body.items !== undefined || body.shipping !== undefined || body.tax !== undefined) {
      const round = (value: number) => Math.round(value * 100) / 100
      update.subtotal = round((update.items || existingOrder.items).reduce((sum: number, item: any) => sum + item.price * item.quantity, 0))
      update.total = round(Math.max(0, update.subtotal + (update.shipping ?? existingOrder.shipping) +
        (update.tax ?? existingOrder.tax) - (existingOrder.discountAmount || 0)))
      if (!Number.isFinite(update.total)) return NextResponse.json({ error: 'Invalid order total' }, { status: 400 })
    }
    if (status) update.status = status
    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber
    if (carrier !== undefined) update.carrier = carrier
    if (estimatedDelivery !== undefined) {
      update.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : undefined
    }

    if (status && status !== existingOrder.status) {
      if (status === 'delivered' && !existingOrder.deliveredAt) {
        update.deliveredAt = new Date()
      }
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

    const order = await Order.findByIdAndUpdate(id, updateQuery, { returnDocument: 'after', runValidators: true }).lean()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ ...order, id: String((order as any)._id) })
  } catch (error: any) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid order details' }, { status: 400 })
    }
    console.error('Order status update error:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
