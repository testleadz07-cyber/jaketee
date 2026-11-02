import { confirmStripeOrder } from '@/lib/stripe-order-confirmation'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'

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

  const stripe = new Stripe(stripeSecretKey)

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
          await confirmStripeOrder(checkoutSession)
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

async function markOrderFailed(checkoutSession: Stripe.Checkout.Session) {
  const db = await connectDB()
  if (!db) throw new Error('Database unavailable while recording failed payment')

  const orderId = checkoutSession.metadata?.orderId || checkoutSession.client_reference_id
  if (!orderId) return

  // Atomic predicate prevents an expired/failed event from cancelling an order
  // concurrently confirmed by verification or a successful webhook.
  await Order.updateOne({ _id: orderId, paymentMethod: 'stripe', paymentId: checkoutSession.id,
    paymentStatus: { $ne: 'paid' }, status: 'pending', 'statusHistory.status': { $ne: 'paid' } }, {
    $set: { status: 'cancelled' },
    $push: { statusHistory: { status: 'cancelled', timestamp: new Date(), note: 'Stripe payment failed or session expired' } },
  })
}
