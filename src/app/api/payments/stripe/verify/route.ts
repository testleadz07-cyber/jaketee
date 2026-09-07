import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Discount from '@/models/Discount'
import Stripe from 'stripe'
import { sendEmail, orderConfirmationTemplate } from '@/lib/email'
import { decrementStockForOrder } from '@/lib/inventory'

// NOTE: This endpoint is a client-triggered convenience path for fast
// confirmation on the order-confirmation page. It is NOT the source of
// truth - the Stripe webhook at /api/webhooks/stripe is, since it fires
// from Stripe's servers even if the customer never makes it back here
// (closed tab, dropped connection, failed redirect, etc). Both paths are
// idempotent and safe to run in either order.
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

    const { sessionId, orderId } = await request.json()

    if (!sessionId || !orderId) {
      return NextResponse.json({ error: 'Session ID and Order ID are required' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    // 1. Fetch order from DB
    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If order is already marked as paid, return success
    if (order.status === 'paid') {
      return NextResponse.json({ status: 'paid', order })
    }

    // 2. Fetch session from Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (stripeSession.payment_status === 'paid') {
      // 3. Update order status in MongoDB to paid
      order.status = 'paid'
      await order.save()

      await decrementStockForOrder(order.items)

      // Increment coupon usage count if applicable
      if (order.promoCode) {
        try {
          await Discount.findOneAndUpdate(
            { code: order.promoCode },
            { $inc: { usageCount: 1 } }
          )
        } catch (discountErr) {
          console.error('Error incrementing discount count on stripe payment verification:', discountErr)
        }
      }

      // 4. Send Nodemailer order confirmation email
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

      return NextResponse.json({ status: 'paid', order })
    } else {
      return NextResponse.json({ status: 'unpaid', error: 'Payment was not finalized.' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Stripe verification failed:', error)
    return NextResponse.json({ error: error.message || 'Failed to verify Stripe payment.' }, { status: 500 })
  }
}
