import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Discount from '@/models/Discount'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal } = body

    if (!code || subtotal === undefined || isNaN(Number(subtotal))) {
      return NextResponse.json({ error: 'Promo code and cart subtotal are required.' }, { status: 400 })
    }

    const uppercaseCode = code.toUpperCase().trim()
    const cartSubtotal = Number(subtotal)

    const db = await connectDB()
    if (db) {
      const discount = await Discount.findOne({ code: uppercaseCode })

      if (!discount) {
        return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 404 })
      }

      if (!discount.isActive) {
        return NextResponse.json({ error: 'This coupon is no longer active.' }, { status: 400 })
      }

      const now = new Date()
      if (discount.startDate && now < new Date(discount.startDate)) {
        return NextResponse.json({ error: 'This coupon is not active yet.' }, { status: 400 })
      }

      if (discount.endDate && now > new Date(discount.endDate)) {
        return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 })
      }

      if (discount.usageLimit !== null && discount.usageLimit !== undefined) {
        if (discount.usageCount >= discount.usageLimit) {
          return NextResponse.json({ error: 'This coupon has reached its usage limit.' }, { status: 400 })
        }
      }

      if (cartSubtotal < discount.minOrderValue) {
        return NextResponse.json({
          error: `Minimum order value of $${discount.minOrderValue.toFixed(2)} is required to use this coupon.`,
        }, { status: 400 })
      }

      let discountAmount = 0
      let freeShipping = false

      if (discount.discountType === 'percentage') {
        discountAmount = (cartSubtotal * discount.discountValue) / 100
      } else if (discount.discountType === 'fixed') {
        discountAmount = discount.discountValue
      } else if (discount.discountType === 'free_shipping') {
        freeShipping = true
      }

      // Cap discount amount at the subtotal
      if (discountAmount > cartSubtotal) {
        discountAmount = cartSubtotal
      }

      return NextResponse.json({
        id: String(discount._id),
        code: discount.code,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        minOrderValue: discount.minOrderValue,
        discountAmount: Number(discountAmount.toFixed(2)),
        freeShipping,
      })
    }

    // Static demo fallback if database is not connected
    console.log('Database not connected. Validating promo code using demo fallback rules.')
    const demoCoupons = [
      { code: 'SUMMER20', discountType: 'percentage', discountValue: 20, minOrderValue: 0 },
      { code: 'WELCOME10', discountType: 'fixed', discountValue: 10, minOrderValue: 30 },
      { code: 'WELCOME15', discountType: 'percentage', discountValue: 15, minOrderValue: 0 },
      { code: 'FREESHIP', discountType: 'free_shipping', discountValue: 0, minOrderValue: 50 },
    ]

    const demoCoupon = demoCoupons.find(c => c.code === uppercaseCode)
    if (!demoCoupon) {
      return NextResponse.json({ error: 'Invalid coupon code (Demo Mode).' }, { status: 404 })
    }

    if (cartSubtotal < demoCoupon.minOrderValue) {
      return NextResponse.json({
        error: `Minimum order value of $${demoCoupon.minOrderValue.toFixed(2)} is required to use this coupon (Demo Mode).`,
      }, { status: 400 })
    }

    let discountAmount = 0
    let freeShipping = false

    if (demoCoupon.discountType === 'percentage') {
      discountAmount = (cartSubtotal * demoCoupon.discountValue) / 100
    } else if (demoCoupon.discountType === 'fixed') {
      discountAmount = demoCoupon.discountValue
    } else if (demoCoupon.discountType === 'free_shipping') {
      freeShipping = true
    }

    if (discountAmount > cartSubtotal) {
      discountAmount = cartSubtotal
    }

    return NextResponse.json({
      id: `demo-${demoCoupon.code}`,
      code: demoCoupon.code,
      discountType: demoCoupon.discountType,
      discountValue: demoCoupon.discountValue,
      minOrderValue: demoCoupon.minOrderValue,
      discountAmount: Number(discountAmount.toFixed(2)),
      freeShipping,
    })
  } catch (error: any) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ error: 'An error occurred during coupon validation.' }, { status: 500 })
  }
}
