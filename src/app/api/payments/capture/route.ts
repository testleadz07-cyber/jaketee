import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Discount from '@/models/Discount'
import { sendEmail, orderConfirmationTemplate } from '@/lib/email'
import { decrementStockForOrder } from '@/lib/inventory'

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'

  if (!clientId || !clientSecret || clientId === 'your_paypal_client_id') {
    return null
  }

  const base = mode === 'live' ? 'https://api.paypal.com' : 'https://api-m.sandbox.paypal.com'
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const res = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data.access_token
  } catch (error) {
    return null
  }
}

// NOTE: This endpoint is a client-triggered convenience path so the browser
// can show a confirmation immediately after the PayPal popup closes. It is
// NOT the source of truth - the PayPal webhook at /api/webhooks/paypal is,
// since it fires from PayPal's servers even if the customer closes the tab
// before this request finishes. Both paths are idempotent and safe to run
// in either order.
async function markOrderPaid(order: InstanceType<typeof Order>, paypalCaptureId: string) {
  if (order.status === 'paid') return

  order.status = 'paid'
  order.statusHistory.push({ status: 'paid', timestamp: new Date(), note: `Confirmed via PayPal capture ${paypalCaptureId}` })
  await order.save()

  await decrementStockForOrder(order.items)

  if (order.promoCode) {
    try {
      await Discount.findOneAndUpdate({ code: order.promoCode }, { $inc: { usageCount: 1 } })
    } catch (err) {
      console.error('Error incrementing discount count on PayPal capture:', err)
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
      subject: `Jacketee - Order Confirmation #${order.orderNumber}`,
      html: emailHtml,
    })
  } catch (emailError) {
    console.error('Nodemailer order confirmation failed to send (PayPal capture):', emailError)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { orderId, dbOrderId } = body

    if (typeof orderId !== 'string' || typeof dbOrderId !== 'string') {
      return NextResponse.json({ error: 'Order references are required' }, { status: 400 })
    }
    if (!(await connectDB())) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }
    const order = await Order.findById(dbOrderId).catch(() => null)
    if (!order || order.paymentMethod !== 'paypal' || order.paymentId !== orderId ||
      (order.userId && String(order.userId) !== String((session?.user as any)?.id || ''))) {
      return NextResponse.json({ error: 'Order does not match this payment' }, { status: 403 })
    }
    if (order.status === 'paid') {
      return NextResponse.json({ status: 'COMPLETED', id: order.paymentId })
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'This order can no longer be paid' }, { status: 409 })
    }

    const accessToken = await getPayPalAccessToken()

    if (accessToken) {
      const mode = process.env.PAYPAL_MODE || 'sandbox'
      const base = mode === 'live' ? 'https://api.paypal.com' : 'https://api-m.sandbox.paypal.com'

      const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.status !== 'COMPLETED' || data.id !== orderId) {
          return NextResponse.json({ error: 'PayPal did not confirm this payment' }, { status: 502 })
        }
        await markOrderPaid(order, data.id)
        return NextResponse.json({
          status: data.status,
          id: data.id,
        })
      } else {
        const errText = await res.text()
        console.error('PayPal Capture Order error:', errText)
        return NextResponse.json({ error: 'Failed to capture PayPal payment' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'PayPal is not configured on this server.' }, { status: 503 })
  } catch (error: any) {
    console.error('Capture payment error:', error)
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
  }
}
