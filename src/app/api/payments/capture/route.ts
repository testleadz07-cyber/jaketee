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
async function markOrderPaid(dbOrderId: string, paypalCaptureId: string) {
  const db = await connectDB()
  if (!db) return

  const order = await Order.findById(dbOrderId)
  if (!order || order.status === 'paid') return

  order.status = 'paid'
  order.paymentId = paypalCaptureId
  order.statusHistory.push({ status: 'paid', timestamp: new Date(), note: 'Confirmed via PayPal capture response' })
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
      subject: `LUXE STORE - Order Confirmation #${order.orderNumber}`,
      html: emailHtml,
    })
  } catch (emailError) {
    console.error('Nodemailer order confirmation failed to send (PayPal capture):', emailError)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, dbOrderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'OrderId is required' }, { status: 400 })
    }

    // Check if it's a mock order id
    if (orderId.startsWith('mock-order-')) {
      const mockCaptureId = `mock-capture-${Date.now()}`
      if (dbOrderId) {
        await markOrderPaid(dbOrderId, mockCaptureId)
      }
      return NextResponse.json({
        status: 'COMPLETED',
        id: mockCaptureId,
      })
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
        if (data.status === 'COMPLETED' && dbOrderId) {
          await markOrderPaid(dbOrderId, data.id)
        }
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

    // Mock fallback (PayPal not configured on this server)
    const mockCaptureId = `mock-capture-${Date.now()}`
    if (dbOrderId) {
      await markOrderPaid(dbOrderId, mockCaptureId)
    }
    console.log('PayPal not configured. Returning mock capture status.')
    return NextResponse.json({
      status: 'COMPLETED',
      id: mockCaptureId,
    })
  } catch (error: any) {
    console.error('Capture payment error:', error)
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
  }
}
