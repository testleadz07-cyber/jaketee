import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Settings from '@/models/Settings'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    let activeGateway = 'both'
    
    if (db) {
      const config = await Settings.findOne({ key: 'payment_gateway' }).lean()
      if (config) {
        activeGateway = config.value
      }
    }

    return NextResponse.json({
      activeGateway,
      clientId: process.env.PAYPAL_CLIENT_ID || 'your_paypal_client_id',
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'your_stripe_publishable_key',
    })
  } catch (error) {
    console.error('Failed to get payment config:', error)
    return NextResponse.json({ error: 'Failed to get config' }, { status: 500 })
  }
}
