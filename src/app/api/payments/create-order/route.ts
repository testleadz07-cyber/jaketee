import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import { CheckoutError, resolveCheckoutCustomer, resolveCheckoutDiscount, resolveCheckoutItems } from '@/lib/checkout-order'

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
    const discount = await resolveCheckoutDiscount(promoCode, subtotal)
    const shippingAmount = discount.freeShipping ? 0 : 30
    const amount = Number((subtotal - discount.amount + shippingAmount).toFixed(2))

    // Create a PENDING order up front, before the payment is captured. This
    // gives the PayPal webhook a record to look up and mark as paid, so
    // confirmation doesn't depend solely on the client calling /capture.
    const orderNumber = `LX-${Date.now()}`
    const pendingOrder = await Order.create({
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
      tax: 0,
      promoCode: discount.code,
      discountAmount: discount.amount,
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

    pendingOrder.status = 'cancelled'
    pendingOrder.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'PayPal is not configured' })
    await pendingOrder.save()
    return NextResponse.json({ error: 'PayPal is not configured on this server.' }, { status: 503 })
  } catch (error: any) {
    console.error('Create payment order error:', error)
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : 'Failed to initiate payment' }, { status: error instanceof CheckoutError ? error.status : 500 })
  }
}
