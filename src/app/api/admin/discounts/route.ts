import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Discount from '@/models/Discount'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (db) {
      const discounts = await Discount.find().sort({ createdAt: -1 }).lean()
      const mapped = discounts.map((d: any) => ({
        ...d,
        id: String(d._id),
      }))
      return NextResponse.json(mapped)
    }

    // Fallback static list in case of no DB
    console.log('Database not connected. Returning static demo discounts list.')
    const demoCoupons = [
      { id: 'demo-SUMMER20', code: 'SUMMER20', discountType: 'percentage', discountValue: 20, minOrderValue: 0, isActive: true, usageCount: 5, usageLimit: 100 },
      { id: 'demo-WELCOME10', code: 'WELCOME10', discountType: 'fixed', discountValue: 10, minOrderValue: 30, isActive: true, usageCount: 2, usageLimit: 50 },
      { id: 'demo-WELCOME15', code: 'WELCOME15', discountType: 'percentage', discountValue: 15, minOrderValue: 0, isActive: true, usageCount: 0, usageLimit: null },
      { id: 'demo-FREESHIP', code: 'FREESHIP', discountType: 'free_shipping', discountValue: 0, minOrderValue: 50, isActive: false, usageCount: 12, usageLimit: null },
    ]
    return NextResponse.json(demoCoupons)
  } catch (error: any) {
    console.error('Error fetching admin discounts:', error)
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const { code, discountType, discountValue, minOrderValue, startDate, endDate, usageLimit, isActive } = body

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Promo code, type, and value are required.' }, { status: 400 })
    }

    const uppercaseCode = code.toUpperCase().trim()

    // Check for duplicate code
    const existing = await Discount.findOne({ code: uppercaseCode })
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 })
    }

    const discount = await Discount.create({
      code: uppercaseCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue || 0),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      usageLimit: usageLimit !== undefined && usageLimit !== '' && usageLimit !== null ? Number(usageLimit) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    })

    return NextResponse.json({ ...discount.toObject(), id: String(discount._id) }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating admin discount:', error)
    return NextResponse.json({ error: 'Failed to create discount coupon' }, { status: 500 })
  }
}
