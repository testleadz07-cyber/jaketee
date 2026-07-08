import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { generateInvoicePdf } from '@/lib/invoice-pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const order = await Order.findById(id).lean()
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const userRole = (session.user as any).role
    const currentUserId = (session.user as any).id
    const orderUserId = (order as any).userId ? String((order as any).userId) : ''

    if (userRole !== 'admin' && orderUserId !== String(currentUserId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const o = order as any

    const pdfBytes = await generateInvoicePdf({
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      userName: o.userName,
      userEmail: o.userEmail,
      items: o.items,
      subtotal: o.subtotal,
      shipping: o.shipping,
      tax: o.tax,
      discountAmount: o.discountAmount,
      promoCode: o.promoCode,
      total: o.total,
      paymentMethod: o.paymentMethod,
      shippingAddress: o.shippingAddress,
    })

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${o.orderNumber}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error: any) {
    console.error('Invoice generation error:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
