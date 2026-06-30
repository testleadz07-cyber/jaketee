import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Discount from '@/models/Discount'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const { code, discountType, discountValue, minOrderValue, startDate, endDate, usageLimit, isActive } = body

    const updateObj: any = {}
    if (code !== undefined) updateObj.code = code.toUpperCase().trim()
    if (discountType !== undefined) updateObj.discountType = discountType
    if (discountValue !== undefined) updateObj.discountValue = Number(discountValue)
    if (minOrderValue !== undefined) updateObj.minOrderValue = Number(minOrderValue)
    if (startDate !== undefined) updateObj.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateObj.endDate = endDate ? new Date(endDate) : null
    if (usageLimit !== undefined) updateObj.usageLimit = usageLimit !== '' && usageLimit !== null ? Number(usageLimit) : null
    if (isActive !== undefined) updateObj.isActive = Boolean(isActive)

    const discount = await Discount.findByIdAndUpdate(id, updateObj, { new: true }).lean()

    if (!discount) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 })
    }

    return NextResponse.json({ ...discount, id: String(discount._id) })
  } catch (error: any) {
    console.error('Error updating admin discount:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const discount = await Discount.findByIdAndDelete(id)

    if (!discount) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Coupon successfully deleted.' })
  } catch (error: any) {
    console.error('Error deleting admin discount:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}
