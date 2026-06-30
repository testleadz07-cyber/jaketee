import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Discount from '@/models/Discount'
import { sendEmail, orderConfirmationTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const { items, subtotal, shipping, tax, total, shippingAddress, paymentId, status, promoCode, discountAmount } = body

    if (!items || items.length === 0 || !total || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 })
    }

    const userId = (session.user as any).id
    const userEmail = session.user.email || ''
    const userName = session.user.name || ''

    const orderNumber = `LX-${Date.now()}`

    // Double check coupon validations if db is connected and code exists
    let verifiedDiscountAmount = discountAmount || 0
    if (promoCode) {
      try {
        const discount = await Discount.findOne({ code: promoCode.toUpperCase().trim() })
        if (discount && discount.isActive) {
          const now = new Date()
          const startValid = !discount.startDate || now >= new Date(discount.startDate)
          const endValid = !discount.endDate || now <= new Date(discount.endDate)
          const usageValid = discount.usageLimit === null || discount.usageLimit === undefined || discount.usageCount < discount.usageLimit
          const minOrderValid = subtotal >= discount.minOrderValue

          if (startValid && endValid && usageValid && minOrderValid) {
            let calculated = 0
            if (discount.discountType === 'percentage') {
              calculated = (subtotal * discount.discountValue) / 100
            } else if (discount.discountType === 'fixed') {
              calculated = discount.discountValue
            }
            if (calculated > subtotal) {
              calculated = subtotal
            }
            verifiedDiscountAmount = Number(calculated.toFixed(2))
          }
        }
      } catch (err) {
        console.error('Failed to verify coupon in order creation API:', err)
      }
    }

    const order = await Order.create({
      orderNumber,
      userId,
      userEmail,
      userName,
      items,
      subtotal,
      shipping: shipping || 0,
      tax: tax || 0,
      promoCode: promoCode ? promoCode.toUpperCase().trim() : undefined,
      discountAmount: verifiedDiscountAmount,
      total,
      status: status || 'pending',
      paymentId,
      shippingAddress,
      statusHistory: [{ status: status || 'pending', timestamp: new Date() }],
    })

    // If order is completed/paid, increment the coupon usage count
    if (order.status === 'paid' && order.promoCode) {
      try {
        await Discount.findOneAndUpdate(
          { code: order.promoCode },
          { $inc: { usageCount: 1 } }
        )
      } catch (err) {
        console.error('Failed to increment coupon usageCount on order creation:', err)
      }
    }

    // Send confirmation email asynchronously
    try {
      const emailItems = order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variants && item.variants.length > 0
          ? item.variants[0]
          : { name: 'Standard', value: 'Default' },
      }))

      const emailHtml = orderConfirmationTemplate({
        orderNumber: order.orderNumber,
        userName: order.userName,
        items: emailItems,
        total: order.total,
        shippingAddress: {
          name: order.shippingAddress.name,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          zip: order.shippingAddress.zip,
          country: order.shippingAddress.country,
        },
      })

      await sendEmail({
        to: order.userEmail,
        subject: `LUXE STORE - Order Confirmation #${order.orderNumber}`,
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('Nodemailer order confirmation failed to send:', emailError)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

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
    } else {
      // Customers can only see their own orders
      query.userId = currentUserId
      if (statusQuery) {
        query.status = statusQuery
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean()
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
