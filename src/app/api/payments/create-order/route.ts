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
    const { amount } = body

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

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
        return NextResponse.json({ id: data.id })
      } else {
        const errText = await res.text()
        console.error('PayPal Create Order error:', errText)
        return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
      }
    }

    // Mock mode fallback
    console.log('PayPal not configured. Returning mock order ID.')
    return NextResponse.json({ id: `mock-order-${Date.now()}` })
  } catch (error: any) {
    console.error('Create payment order error:', error)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
}
