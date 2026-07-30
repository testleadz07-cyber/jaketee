import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'
import mongoose from 'mongoose'
import { hashPassword } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const user = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orders = await Order.find({ userId: id })
      .sort({ createdAt: -1 })
      .select('orderNumber total status createdAt items')
      .lean()

    const orderCount = orders.length
    const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)

    const Activity = (await import('@/models/Activity')).default
    const activities = await Activity.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const lastWithCountry = (activities || []).find(
      (act: any) => act.country && act.country !== 'Unknown' && act.country !== 'Localhost'
    )
    const resolvedCountry = lastWithCountry?.country || 'Unknown'

    return NextResponse.json({
      id: String((user as any)._id),
      name: (user as any).name,
      email: (user as any).email,
      role: (user as any).role,
      isActive: (user as any).isActive !== false,
      phone: (user as any).phone || null,
      avatar: (user as any).avatar || null,
      addresses: (user as any).addresses || [],
      createdAt: (user as any).createdAt,
      orderCount,
      totalSpent,
      orders: orders.map((o: any) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
        itemCount: (o.items || []).length,
      })),
      activities: (activities || []).map((act: any) => ({
        id: String(act._id),
        action: act.action,
        details: act.details || null,
        ip: act.ip || null,
        userAgent: act.userAgent || null,
        country: act.country || 'Unknown',
        createdAt: act.createdAt,
      })),
      country: resolvedCountry,
    })
  } catch (error: any) {
    console.error('Admin user detail fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const currentAdminId = (session.user as any).id
    const body = await request.json()
    const { name, email, phone, role, isActive, password, addresses } = body

    const update: Record<string, any> = {}

    if (typeof name === 'string' && name.trim()) update.name = name.trim()
    if (typeof phone === 'string') update.phone = phone.trim()

    if (role !== undefined) {
      if (!['admin', 'customer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      if (String(currentAdminId) === String(id) && role !== 'admin') {
        return NextResponse.json({ error: 'You cannot remove your own admin role.' }, { status: 400 })
      }
      update.role = role
    }

    if (isActive !== undefined) {
      if (String(currentAdminId) === String(id) && isActive === false) {
        return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 })
      }
      update.isActive = !!isActive
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
      }
      const normalizedEmail = email.toLowerCase().trim()
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } })
      if (existing) {
        return NextResponse.json({ error: 'Another account already uses this email' }, { status: 409 })
      }
      update.email = normalizedEmail
    }

    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      update.password = await hashPassword(password)
    }

    if (addresses !== undefined) {
      if (!Array.isArray(addresses)) {
        return NextResponse.json({ error: 'Addresses must be a list' }, { status: 400 })
      }
      for (const addr of addresses) {
        if (!addr.name || !addr.street || !addr.city || !addr.state || !addr.zip) {
          return NextResponse.json({ error: 'Each address requires name, street, city, state, and zip' }, { status: 400 })
        }
      }
      update.addresses = addresses.map((addr: any) => ({
        label: addr.label || 'Home',
        name: addr.name,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country || 'United States',
        phone: addr.phone || undefined,
        isDefault: !!addr.isDefault,
      }))
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select('-password -resetPasswordToken -resetPasswordExpires')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive !== false,
      phone: user.phone || null,
      addresses: user.addresses || [],
    })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Another account already uses this email' }, { status: 409 })
    }
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const currentAdminId = (session.user as any).id
    if (String(currentAdminId) === String(id)) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin user delete error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
