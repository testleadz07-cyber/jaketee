import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'OrderId is required' }, { status: 400 })
    }

    // Check if it's a mock order id
    if (orderId.startsWith('mock-order-')) {
      return NextResponse.json({
        status: 'COMPLETED',
        id: `mock-capture-${Date.now()}`,
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

    // Mock fallback
    console.log('PayPal not configured. Returning mock capture status.')
    return NextResponse.json({
      status: 'COMPLETED',
      id: `mock-capture-${Date.now()}`,
    })
  } catch (error: any) {
    console.error('Capture payment error:', error)
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
  }
}
