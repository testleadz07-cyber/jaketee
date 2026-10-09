import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import crypto from 'crypto'
import { STANDARD_SHIPPING_USD, normalizeShippingCountry, shippingCountryError } from '@/config/fulfillment'
import { getOrderPaymentStatus } from '@/lib/order-payment-status'

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
      return NextResponse.json(orders.map((order: any) => ({ ...order, paymentStatus: getOrderPaymentStatus(order) })), {
        headers: { 'X-Total-Count': String(total), 'X-Page': String(page), 'X-Pages': String(Math.max(1, Math.ceil(total / limit))) },
      })
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean()
    return NextResponse.json(orders.map((order: any) => ({ ...order, paymentStatus: getOrderPaymentStatus(order) })))
  } catch (error: any) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized – Admin only' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const {
      customerName,
      customerEmail,
      userId,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      status,
      notes,
      shipping,
      tax,
    } = body

    // Validate required fields
    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: 'Customer name and email are required' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one order item is required' }, { status: 400 })
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
      return NextResponse.json({ error: 'Complete shipping address is required (name, street, city, state, zip)' }, { status: 400 })
    }

    const countryError = shippingCountryError(shippingAddress.country)
    if (countryError) return NextResponse.json({ error: countryError }, { status: 400 })

    // Validate items
    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || item.price <= 0 || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json({ error: `Invalid item: each item needs a name, price > 0, and quantity > 0` }, { status: 400 })
      }
    }

    // Validate enums
    const validPaymentMethods = ['paypal', 'stripe', 'cash', 'bank_transfer', 'other']
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const validPaymentStatuses = ['unpaid', 'paid', 'partially_paid']
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
    }

    const validStatuses = ['pending', 'paid', 'in_production', 'shipped', 'in_transit', 'delivered', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
    }

    // Generate unique order number: CO-XXXXXX (CO = Custom Order)
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
    const orderNumber = `CO-${randomSuffix}`

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const shippingCost = typeof shipping === 'number' ? shipping : STANDARD_SHIPPING_USD
    const taxAmount = typeof tax === 'number' ? tax : 0
    const total = subtotal + shippingCost + taxAmount

    // Format items for schema
    const formattedItems = items.map((item: any) => ({
      productId: item.productId || 'custom',
      name: item.name,
      image: item.image || '/placeholder.svg',
      price: item.price,
      quantity: item.quantity,
      variants: item.variants || [],
    }))

    const order = await Order.create({
      orderNumber,
      userId: userId || undefined,
      userEmail: customerEmail,
      userName: customerName,
      items: formattedItems,
      subtotal,
      shipping: shippingCost,
      tax: taxAmount,
      total,
      status: status || 'pending',
      paymentMethod: paymentMethod || 'other',
      paymentStatus: paymentStatus || 'unpaid',
      isCustomOrder: true,
      shippingAddress: {
        name: shippingAddress.name,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: normalizeShippingCountry(shippingAddress.country),
        phone: shippingAddress.phone || undefined,
      },
      notes: notes || undefined,
      statusHistory: [
        {
          status: status || 'pending',
          timestamp: new Date(),
          note: 'Custom order created by admin',
        },
      ],
    })

    return NextResponse.json({ ...order.toObject(), id: String(order._id) }, { status: 201 })
  } catch (error: any) {
    console.error('Custom order creation error:', error)
    return NextResponse.json({ error: 'Failed to create custom order' }, { status: 500 })
  }
}
