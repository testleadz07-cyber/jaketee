import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Discount from '@/models/Discount'
import { sendEmail, orderConfirmationTemplate } from '@/lib/email'

// This endpoint is the SOURCE OF TRUTH for Stripe payment confirmation.
// Unlike /api/payments/stripe/verify (which only runs if the customer's
// browser makes it back to the success page), Stripe calls this endpoint
// directly from its servers, so orders still get confirmed even if the
// customer closes the tab, loses connection, or the redirect fails.
export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key') {
    return NextResponse.json({ error: 'Stripe is not configured on this server.' }, { status: 503 })
  }

  if (!webhookSecret || webhookSecret === 'your_stripe_webhook_secret') {
    console.error('STRIPE_WEBHOOK_SECRET is not set - refusing to process unverifiable Stripe webhook event.')
    return NextResponse.json({ error: 'Webhook secret not configured on this server.' }, { status: 503 })
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-01-27-ac' as any,
  })

  // Signature verification requires the raw, unparsed request body.
  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        if (checkoutSession.payment_status === 'paid') {
          await markOrderPaid(checkoutSession)
        }
        break
      }
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        await markOrderFailed(checkoutSession)
        break
      }
      default:
        // Ignore events we don't act on.
        break
    }
  } catch (err: any) {
    console.error('Error handling Stripe webhook event:', event.type, err)
    // Return 500 so Stripe retries delivery instead of assuming it succeeded.
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function markOrderPaid(checkoutSession: Stripe.Checkout.Session) {
  const db = await connectDB()
  if (!db) {
    throw new Error('Database connection failed while handling Stripe webhook')
  }

  const orderId = checkoutSession.metadata?.orderId || checkoutSession.client_reference_id
  if (!orderId) {
    console.error('Stripe webhook: checkout session missing orderId metadata', checkoutSession.id)
    return
  }

  const order = await Order.findById(orderId)
  if (!order) {
    console.error('Stripe webhook: order not found for session', checkoutSession.id, orderId)
    return
  }

  // Idempotency guard: /api/payments/stripe/verify may have already confirmed
  // this order via the client redirect, or Stripe may redeliver the event.
  if (order.status === 'paid') {
    return
  }

  order.status = 'paid'
  order.paymentId = checkoutSession.id
  order.statusHistory.push({ status: 'paid', timestamp: new Date(), note: 'Confirmed via Stripe webhook' })
  await order.save()

  if (order.promoCode) {
    try {
      await Discount.findOneAndUpdate(
        { code: order.promoCode },
        { $inc: { usageCount: 1 } }
      )
    } catch (err) {
      console.error('Error incrementing discount count from Stripe webhook:', err)
    }
  }

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
    console.error('Nodemailer order confirmation failed to send (Stripe webhook):', emailError)
  }
}

async function markOrderFailed(checkoutSession: Stripe.Checkout.Session) {
  const db = await connectDB()
  if (!db) return

  const orderId = checkoutSession.metadata?.orderId || checkoutSession.client_reference_id
  if (!orderId) return

  const order = await Order.findById(orderId)
  if (!order || order.status === 'paid') return

  order.status = 'cancelled'
  order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'Stripe payment failed or session expired' })
  await order.save()
}
