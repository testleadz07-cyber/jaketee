import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Discount from '@/models/Discount'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key') {
      return NextResponse.json({ error: 'Stripe is not configured on this server.' }, { status: 503 })
    }

    // Initialize Stripe SDK on demand
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27-ac' as any,
    })

    const body = await request.json()
    const { items, shippingAddress, promoCode } = body

    if (!items || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required checkout items or shipping info' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const userId = (session.user as any).id
    const userEmail = session.user.email || ''
    const userName = session.user.name || ''

    // Calculate subtotal from products
    let subtotal = 0
    const lineItems = items.map((item: any) => {
      const itemPrice = Number(item.price)
      subtotal += itemPrice * Number(item.quantity)
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(itemPrice * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      }
    })

    // Perform Coupon Code Backend Validations
    let discountAmount = 0
    let isFreeShipping = false
    let stripeCouponId: string | undefined = undefined

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
            if (discount.discountType === 'percentage') {
              discountAmount = (subtotal * discount.discountValue) / 100
              const stripeCoupon = await stripe.coupons.create({
                percent_off: discount.discountValue,
                duration: 'once',
                name: discount.code,
              })
              stripeCouponId = stripeCoupon.id
            } else if (discount.discountType === 'fixed') {
              discountAmount = discount.discountValue
              const stripeCoupon = await stripe.coupons.create({
                amount_off: Math.round(discount.discountValue * 100),
                currency: 'usd',
                duration: 'once',
                name: discount.code,
              })
              stripeCouponId = stripeCoupon.id
            } else if (discount.discountType === 'free_shipping') {
              isFreeShipping = true
            }

            if (discountAmount > subtotal) {
              discountAmount = subtotal
            }
          }
        }
      } catch (err) {
        console.error('Error applying coupon in Stripe checkout API:', err)
      }
    }

    // Setup calculations
    const taxAmount = 0
    const shippingAmount = 0
    const total = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount)

    const orderNumber = `LX-${Date.now()}`

    // 1. Create PENDING order in MongoDB to track database references
    const order = await Order.create({
      orderNumber,
      userId,
      userEmail,
      userName,
      items: items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        variants: item.variants || [],
      })),
      subtotal,
      shipping: shippingAmount,
      tax: taxAmount,
      promoCode: promoCode ? promoCode.toUpperCase().trim() : undefined,
      discountAmount: Number(discountAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
      status: 'pending',
      paymentMethod: 'stripe',
      shippingAddress,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 2. Build Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: userEmail,
      client_reference_id: String(order._id),
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
      metadata: {
        orderId: String(order._id),
        orderNumber,
      },
      success_url: `${appUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`,
      cancel_url: `${appUrl}/checkout`,
    })

    // Update order with the Stripe Session ID to link them
    order.paymentId = stripeSession.id
    await order.save()

    return NextResponse.json({ url: stripeSession.url })
  } catch (error: any) {
    console.error('Stripe session creation failed:', error)
    return NextResponse.json({ error: error.message || 'Stripe Checkout generation failed.' }, { status: 500 })
  }
}
