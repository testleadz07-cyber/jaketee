import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Stripe from 'stripe'
import { CheckoutError, resolveCheckoutCustomer, resolveCheckoutDiscount, resolveCheckoutItems } from '@/lib/checkout-order'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key') {
      return NextResponse.json({ error: 'Stripe is not configured on this server.' }, { status: 503 })
    }

    // Initialize Stripe SDK on demand
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27-ac' as any,
    })

    const body = await request.json()
    const { items: rawItems, shippingAddress, promoCode, email } = body

    if (!rawItems || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required checkout items or shipping info' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { userId, userEmail, userName } = resolveCheckoutCustomer(session?.user as any, email, shippingAddress)
    const items = await resolveCheckoutItems(rawItems)

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image.startsWith('https://') ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }
    })

    // Perform Coupon Code Backend Validations
    const discount = await resolveCheckoutDiscount(promoCode, subtotal)
    const discountAmount = discount.amount
    const isFreeShipping = discount.freeShipping
    let stripeCouponId: string | undefined = undefined

    if (discount.type === 'percentage') {
      const stripeCoupon = await stripe.coupons.create({
        percent_off: discount.value,
        duration: 'once',
        name: discount.code,
      })
      stripeCouponId = stripeCoupon.id
    } else if (discount.type === 'fixed' && discountAmount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: 'usd',
        duration: 'once',
        name: discount.code,
      })
      stripeCouponId = stripeCoupon.id
    }

    // Setup calculations
    const taxAmount = 0
    const shippingAmount = isFreeShipping ? 0 : 30
    const total = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount)

    const orderNumber = `LX-${Date.now()}`

    // 1. Create PENDING order in MongoDB to track database references
    const order = await Order.create({
      orderNumber,
      userId,
      userEmail,
      userName,
      items: items.map((item) => ({
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
      promoCode: discount.code,
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
      shipping_options: shippingAmount ? [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 3000, currency: 'usd' },
          display_name: 'Shipping',
        },
      }] : undefined,
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
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : 'Stripe Checkout generation failed.' }, { status: error instanceof CheckoutError ? error.status : 500 })
  }
}
