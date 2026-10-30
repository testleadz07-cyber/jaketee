import { createHash, randomUUID } from 'node:crypto'
import { notifyOrder } from '@/lib/notifications'

import { calculateShipping } from '@/config/fulfillment'
import { verifyAddressConfirmation } from '@/lib/address-confirmation'
import { after, NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Stripe from 'stripe'
import { CheckoutError, resolveCheckoutCustomer, resolveCheckoutDiscount, resolveCheckoutItems } from '@/lib/checkout-order'

export async function POST(request: NextRequest) {
  const started = Date.now()
  let stage = 'authentication'
  const traceId = randomUUID()
  const mark = (next: string) => { stage = next; console.info('Stripe checkout stage', { traceId, stage, elapsedMs: Date.now() - started }) }
  try {
    const session = await getServerSession(authOptions)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key') {
      return NextResponse.json({ error: 'Stripe is not configured on this server.' }, { status: 503 })
    }

    // Initialize Stripe SDK on demand
    const providerDeadline = AbortSignal.timeout(25000)
    const stripe = new Stripe(stripeSecretKey, {
      httpClient: Stripe.createFetchHttpClient((input, init) => fetch(input, {
        ...init, signal: init?.signal ? AbortSignal.any([init.signal, providerDeadline]) : providerDeadline,
      })),
      timeout: 10000,
      maxNetworkRetries: 0,
    })

    const body = await request.json()
    const { items: rawItems, shippingAddress, promoCode, email } = body

    if (!rawItems || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required checkout items or shipping info' }, { status: 400 })
    }

    if (typeof body.checkoutAttemptId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.checkoutAttemptId)) {
      return NextResponse.json({ error: 'Refresh checkout and try again.' }, { status: 400 })
    }
    mark('database')
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { userId, userEmail, userName } = await resolveCheckoutCustomer(session?.user as any, email, shippingAddress)
    const shippingAddressConfirmedAt = verifyAddressConfirmation(body.addressConfirmationToken, shippingAddress, userEmail, userId)
    const fingerprint = createHash('sha256').update(JSON.stringify({ items: rawItems, shippingAddress, promoCode, email: userEmail, mode: body.checkoutMode })).digest('hex')
    const attemptKey = createHash('sha256').update(`${userId || userEmail}:${body.checkoutAttemptId}`).digest('hex')
    // Initialize the unique sparse index before accepting concurrent attempts.
    await Order.init()
    const reserved = await Order.findOne({ stripeAttemptKey: attemptKey })
    if (reserved && reserved.stripeAttemptFingerprint !== fingerprint) {
      return NextResponse.json({ error: 'Checkout details changed. Return to review before starting a new payment.' }, { status: 409 })
    }
    mark('validation')
    // Resume the original validated quote, even if catalog prices changed since the lost response.
    const items = reserved ? reserved.items : await resolveCheckoutItems(rawItems)

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discount = reserved ? { amount: reserved.discountAmount || 0, freeShipping: reserved.shipping === 0, code: reserved.promoCode } : await resolveCheckoutDiscount(promoCode, subtotal)
    const discountAmount = discount.amount
    const isFreeShipping = discount.freeShipping

    // Setup calculations
    const taxAmount = 0
    const shippingAmount = calculateShipping(items.reduce((count, item) => count + item.quantity, 0), isFreeShipping)
    const total = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount)

    const orderNumber = `LX-${Date.now()}-${randomUUID().slice(0, 8)}`

    // 1. Create PENDING order in MongoDB to track database references
    mark('reserve_order')
    let order
    try {
      order = await Order.findOneAndUpdate({ stripeAttemptKey: attemptKey }, { $setOnInsert: {
      stripeAttemptKey: attemptKey,
      stripeAttemptFingerprint: fingerprint,
      stripeReturnOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
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
        customization: item.customization,
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
      shippingAddressConfirmedAt,
    } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })
    } catch (cause) {
      if ((cause as { code?: number }).code !== 11000) throw cause
      order = await Order.findOne({ stripeAttemptKey: attemptKey })
    }
    if (!order || order.stripeAttemptFingerprint !== fingerprint) {
      return NextResponse.json({ error: 'Checkout details changed. Return to review before starting a new payment.' }, { status: 409 })
    }
    if (order.paymentStatus === 'paid' || order.status !== 'pending') {
      return NextResponse.json({ error: 'This checkout is already completed or closed. Check your orders before trying again.' }, { status: 409 })
    }
    // Stripe keeps idempotency results for at least 24h. Never recreate an old uncertain attempt.
    if (Date.now() - new Date(order.createdAt).getTime() > 23 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'This checkout attempt is too old. Contact support before starting another payment.' }, { status: 409 })
    }
    if (order.paymentId) {
      mark('recover_session')
      const existing = await stripe.checkout.sessions.retrieve(order.paymentId)
      if (existing.status === 'open' && existing.url) return NextResponse.json({ url: existing.url })
      if (existing.status === 'expired') return NextResponse.json({ error: 'The payment session expired. Retry checkout to start a fresh session.', code: 'CHECKOUT_SESSION_EXPIRED' }, { status: 409 })
      return NextResponse.json({ error: 'This payment session is completed. Check your orders before trying again.' }, { status: 409 })
    }
    const lineItems = order.items.map(item => ({
      price_data: { currency: 'usd', product_data: { name: item.name, images: item.image.startsWith('https://') ? [item.image] : [] }, unit_amount: Math.round(item.price * 100) },
      quantity: item.quantity,
    }))
    let stripeCouponId: string | undefined
    if ((order.discountAmount || 0) > 0) {
      mark('coupon')
      const coupon = await stripe.coupons.create({ amount_off: Math.round(order.discountAmount! * 100), currency: 'usd', duration: 'once', name: order.promoCode || 'Checkout discount' }, { idempotencyKey: `checkout-coupon:${attemptKey}` })
      stripeCouponId = coupon.id
    }

    const appUrl = order.stripeReturnOrigin!

    // 2. Build Stripe Checkout Session
    mark('stripe_session')
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      // Shipping was already validated and saved on the order. Do not ask
      // customers to enter it again on the hosted payment page.
      billing_address_collection: 'auto',
      line_items: lineItems,
      shipping_options: order.shipping ? [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: Math.round(order.shipping * 100), currency: 'usd' },
          display_name: 'Shipping',
        },
      }] : undefined,
      mode: 'payment',
      customer_email: order.userEmail,
      client_reference_id: String(order._id),
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
      metadata: {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
      },
      success_url: `${appUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`,
      cancel_url: `${appUrl}/checkout${body.checkoutMode === 'buy-now' ? '?mode=buy-now' : ''}`,
    }, { idempotencyKey: `checkout-session:${attemptKey}` })

    // Update order with the Stripe Session ID to link them
    mark('save_session')
    order.paymentId = stripeSession.id
    await order.save()
    try { after(async () => { await notifyOrder(order) }) } catch { console.error('Order notification scheduling failed', { traceId }) }
    mark('ready')

    return NextResponse.json({ url: stripeSession.url })
  } catch (error: any) {
    console.error('Stripe checkout failed', { traceId, stage, elapsedMs: Date.now() - started, type: typeof error?.type === 'string' ? error.type : 'CheckoutFailure' })
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : 'Payment setup could not finish. Retry with the same checkout; do not place another order.', traceId }, { status: error instanceof CheckoutError ? error.status : 503 })
  }
}
