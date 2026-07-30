import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Discount from '@/models/Discount'
import { sendEmail, orderConfirmationTemplate } from '@/lib/email'
import { decrementStockForOrder } from '@/lib/inventory'

// This endpoint is the SOURCE OF TRUTH for PayPal payment confirmation.
// Unlike /api/payments/capture (which only runs if the customer's browser
// makes it through the PayPal popup flow), PayPal calls this endpoint
// directly from its servers, so orders still get confirmed even if the
// customer closes the tab, loses connection, or the client-side capture
// request never completes.
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'

  if (!clientId || !clientSecret || clientId === 'your_paypal_client_id') {
    return null
  }

  const base = mode === 'live' ? 'https://api.paypal.com' : 'https://api-m.sandbox.paypal.com'
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.access_token
}

async function verifyWebhookSignature(request: NextRequest, rawBody: string): Promise<any | null> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId || webhookId === 'your_paypal_webhook_id') {
    console.error('PAYPAL_WEBHOOK_ID is not set - refusing to process unverifiable PayPal webhook event.')
    return null
  }

  const accessToken = await getPayPalAccessToken()
  if (!accessToken) {
    console.error('PayPal webhook: could not obtain access token to verify signature.')
    return null
  }

  const mode = process.env.PAYPAL_MODE || 'sandbox'
  const base = mode === 'live' ? 'https://api.paypal.com' : 'https://api-m.sandbox.paypal.com'

  const verificationPayload = {
    auth_algo: request.headers.get('paypal-auth-algo'),
    cert_url: request.headers.get('paypal-cert-url'),
    transmission_id: request.headers.get('paypal-transmission-id'),
    transmission_sig: request.headers.get('paypal-transmission-sig'),
    transmission_time: request.headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  }

  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verificationPayload),
  })

  if (!res.ok) {
    console.error('PayPal webhook signature verification request failed:', await res.text())
    return null
  }

  const result = await res.json()
  if (result.verification_status !== 'SUCCESS') {
    console.error('PayPal webhook signature verification failed:', result)
    return null
  }

  return verificationPayload.webhook_event
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const event = await verifyWebhookSignature(request, rawBody)
  if (!event) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        await markOrderPaid(event.resource)
        break
      }
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
      case 'CHECKOUT.ORDER.VOIDED': {
        await markOrderFailed(event.resource)
        break
      }
      default:
        // Ignore events we don't act on.
        break
    }
  } catch (err: any) {
    console.error('Error handling PayPal webhook event:', event.event_type, err)
    // Return 500 so PayPal retries delivery instead of assuming it succeeded.
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function extractPaypalOrderId(resource: any): string | undefined {
  return (
    resource?.custom_id ||
    resource?.supplementary_data?.related_ids?.order_id ||
    resource?.id
  )
}

async function findOrderForResource(resource: any) {
  const db = await connectDB()
  if (!db) {
    throw new Error('Database connection failed while handling PayPal webhook')
  }

  // custom_id on the capture is our own Mongo _id (set at order creation).
  if (resource?.custom_id) {
    const order = await Order.findById(resource.custom_id).catch(() => null)
    if (order) return order
  }

  // Fall back to matching on the PayPal order id we stored as paymentId.
  const paypalOrderId = extractPaypalOrderId(resource)
  if (paypalOrderId) {
    return Order.findOne({ paymentId: paypalOrderId })
  }

  return null
}

async function markOrderPaid(resource: any) {
  const order = await findOrderForResource(resource)
  if (!order) {
    console.error('PayPal webhook: order not found for capture', resource?.id)
    return
  }

  // Idempotency guard: /api/payments/capture may have already confirmed
  // this order via the client flow, or PayPal may redeliver the event.
  if (order.status === 'paid') {
    return
  }

  order.status = 'paid'
  order.paymentId = resource.id
  order.statusHistory.push({ status: 'paid', timestamp: new Date(), note: 'Confirmed via PayPal webhook' })
  await order.save()

  await decrementStockForOrder(order.items)

  if (order.promoCode) {
    try {
      await Discount.findOneAndUpdate(
        { code: order.promoCode },
        { $inc: { usageCount: 1 } }
      )
    } catch (err) {
      console.error('Error incrementing discount count from PayPal webhook:', err)
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
    console.error('Nodemailer order confirmation failed to send (PayPal webhook):', emailError)
  }
}

async function markOrderFailed(resource: any) {
  const order = await findOrderForResource(resource)
  if (!order || order.status === 'paid') return

  order.status = 'cancelled'
  order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'PayPal payment denied or voided' })
  await order.save()
}
