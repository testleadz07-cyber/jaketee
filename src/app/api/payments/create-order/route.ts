import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'

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
      console.error('PayPal OAuth failed:', await res.text())
      return null
    }

    const data = await res.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting PayPal token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, items, shippingAddress, promoCode, discountAmount, subtotal } = body

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

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

    // Create a PENDING order up front, before the payment is captured. This
    // gives the PayPal webhook a record to look up and mark as paid, so
    // confirmation doesn't depend solely on the client calling /capture.
    const orderNumber = `LX-${Date.now()}`
    const pendingOrder = await Order.create({
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
      subtotal: subtotal ?? amount,
      shipping: 0,
      tax: 0,
      promoCode: promoCode ? promoCode.toUpperCase().trim() : undefined,
      discountAmount: Number((discountAmount || 0).toFixed ? discountAmount.toFixed(2) : discountAmount || 0),
      total: Number(Number(amount).toFixed(2)),
      status: 'pending',
      paymentMethod: 'paypal',
      shippingAddress,
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    })

    const accessToken = await getPayPalAccessToken()

    if (accessToken) {
      const mode = process.env.PAYPAL_MODE || 'sandbox'
      const base = mode === 'live' ? 'https://api.paypal.com' : 'https://api-m.sandbox.paypal.com'

      const res = await fetch(`${base}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              custom_id: String(pendingOrder._id),
              amount: {
                currency_code: 'USD',
                value: Number(amount).toFixed(2),
              },
            },
          ],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Link the PayPal order id back to our DB order so the webhook and
        // /capture route can both find it.
        pendingOrder.paymentId = data.id
        await pendingOrder.save()
        return NextResponse.json({ id: data.id, orderId: String(pendingOrder._id) })
      } else {
        const errText = await res.text()
        console.error('PayPal Create Order error:', errText)
        pendingOrder.status = 'cancelled'
        pendingOrder.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'PayPal order creation failed' })
        await pendingOrder.save()
        return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
      }
    }

    // Mock mode fallback (PayPal not configured on this server)
    const mockId = `mock-order-${Date.now()}`
    pendingOrder.paymentId = mockId
    await pendingOrder.save()
    console.log('PayPal not configured. Returning mock order ID.')
    return NextResponse.json({ id: mockId, orderId: String(pendingOrder._id) })
  } catch (error: any) {
    console.error('Create payment order error:', error)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
}
