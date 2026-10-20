import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import { CheckoutError, resolveCheckoutCustomer } from '@/lib/checkout-order'
import { issueAddressConfirmation } from '@/lib/address-confirmation'
import { hasValidActivityOrigin } from '@/lib/activity-origin'

export async function POST(request: NextRequest) {
  try {
    if (!hasValidActivityOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    const body = await request.json()
    if (body?.confirmed !== true) throw new CheckoutError('Please confirm your delivery address')
    if (!await connectDB()) return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    const session = await getServerSession(authOptions)
    const { userId, userEmail } = await resolveCheckoutCustomer(session?.user as any, body.email, body.shippingAddress)
    const address = body.shippingAddress
    const shippingAddress = {
      name: address.name, street: address.street, city: address.city, state: address.state,
      zip: address.zip, country: address.country, phone: address.phone || '',
    }
    return NextResponse.json({
      shippingAddress, email: userEmail, ...issueAddressConfirmation(shippingAddress, userEmail, userId),
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : 'Unable to confirm delivery address' },
      { status: error instanceof CheckoutError ? error.status : 400 })
  }
}
