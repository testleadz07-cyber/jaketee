import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Discount from '@/models/Discount'
import AbandonedCart from '@/models/AbandonedCart'
import Product from '@/models/Product'
import { sendEmail, orderConfirmationTemplate } from '@/lib/email'
import { getCountryFromRequest } from '@/lib/geo'

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

    // Reserve stock atomically per line item before the order is created.
    // Each decrement is conditioned on stockCount >= quantity so concurrent
    // requests can't both succeed against the same last unit. If any item
    // can't be reserved, roll back the decrements already applied and bail.
    const decrementedItems: { productId: string; quantity: number }[] = []
    for (const item of items) {
      const quantity = Number(item.quantity) || 0
      if (!item.productId || quantity <= 0) {
        for (const d of decrementedItems) {
          await Product.findByIdAndUpdate(d.productId, { $inc: { stockCount: d.quantity } })
        }
        return NextResponse.json({ error: 'Invalid order item' }, { status: 400 })
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stockCount: { $gte: quantity } },
        { $inc: { stockCount: -quantity } },
        { new: true }
      )

      if (!updatedProduct) {
        // Not enough stock (or product missing) — roll back everything
        // reserved so far in this request.
        for (const d of decrementedItems) {
          await Product.findByIdAndUpdate(d.productId, { $inc: { stockCount: d.quantity } })
        }
        return NextResponse.json(
          { error: `Insufficient stock for "${item.name || item.productId}"` },
          { status: 409 }
        )
      }

      decrementedItems.push({ productId: item.productId, quantity })

      if (updatedProduct.stockCount <= 0 && updatedProduct.inStock) {
        await Product.findByIdAndUpdate(item.productId, { inStock: false })
      }
    }

    let order
    try {
      order = await Order.create({
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

      // Log place_order activity
      try {
        const Activity = (await import('@/models/Activity')).default
        const xForwardedFor = request.headers.get('x-forwarded-for')
        const ip = xForwardedFor
          ? xForwardedFor.split(',')[0].trim()
          : request.headers.get('x-real-ip') || '127.0.0.1'

        const country = getCountryFromRequest(request)
          || (ip === '127.0.0.1' || ip === '::1' ? 'Localhost' : 'Unknown')

        await Activity.create({
          userId,
          action: 'place_order',
          details: { orderNumber: order.orderNumber, total: order.total },
          ip,
          userAgent: request.headers.get('user-agent') || undefined,
          country,
        })
      } catch (activityErr) {
        console.error('Failed to log order placement activity:', activityErr)
      }
    } catch (err) {
      // Order creation failed after stock was reserved — release it back.
      for (const d of decrementedItems) {
        await Product.findByIdAndUpdate(d.productId, { $inc: { stockCount: d.quantity } })
      }
      throw err
    }

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

    // A placed order means the cart converted — remove any abandoned-cart
    // snapshot so the recovery cron never emails this user about a cart
    // they already checked out.
    try {
      await AbandonedCart.deleteOne({ userId })
    } catch (err) {
      console.error('Failed to clear abandoned cart record after order creation:', err)
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
        subject: `Jacketee - Order Confirmation #${order.orderNumber}`,
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
      // Customers can only see their own orders
      query.userId = currentUserId
      if (statusQuery) {
        query.status = statusQuery
      }
    }

    // Pagination is opt-in (only applied when page/limit are explicitly
    // passed) so existing unpaginated customer-facing callers are unaffected.
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
