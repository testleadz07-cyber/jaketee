import { confirmStripeOrder } from '@/lib/stripe-order-confirmation'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Stripe from 'stripe'

// NOTE: This endpoint is a client-triggered convenience path for fast
// confirmation on the order-confirmation page. It is NOT the source of
// truth - the Stripe webhook at /api/webhooks/stripe is, since it fires
// from Stripe's servers even if the customer never makes it back here
// (closed tab, dropped connection, failed redirect, etc). Both paths are
// idempotent and safe to run in either order.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key') {
      return NextResponse.json({ error: 'Stripe is not configured on this server.' }, { status: 503 })
    }

    // Initialize Stripe SDK on demand
    const stripe = new Stripe(stripeSecretKey, { httpClient: Stripe.createFetchHttpClient(), timeout: 10000, maxNetworkRetries: 0 })

    const { sessionId, orderId } = await request.json()

    if (typeof sessionId !== 'string' || !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId) ||
        typeof orderId !== 'string' || !/^[a-f0-9]{24}$/i.test(orderId)) {
      return NextResponse.json({ error: 'Session ID and Order ID are required' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    // 1. Fetch order from DB
    const order = await Order.findById(orderId)
    if (!order || order.paymentMethod !== 'stripe' || order.paymentId !== sessionId ||
      (order.userId && String(order.userId) !== String((session?.user as any)?.id || ''))) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. Fetch session from Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
    if (stripeSession.client_reference_id !== String(order._id) || stripeSession.metadata?.orderId !== String(order._id)) {
      return NextResponse.json({ error: 'Payment does not match this order' }, { status: 403 })
    }
    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json({ status: 'unpaid', error: 'Payment was not finalized. Check payment status before trying again.' }, { status: 400 })
    }
    const confirmed = await confirmStripeOrder(stripeSession)
    return NextResponse.json({ status: 'paid', order: confirmed }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    console.error('Stripe verification failed', { type: error?.type || error?.name || 'Error' })
    return NextResponse.json({ error: 'Unable to verify payment right now. Retry verification; do not pay again.' }, { status: 500 })
  }
}
