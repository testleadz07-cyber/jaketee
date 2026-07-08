import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import { generateInvoicePdf } from '@/lib/invoice-pdf'

// Public invoice download for guests (and anyone) who know the order number
// and the email address used at checkout. Mirrors the security model of
// /api/orders/track - no authentication required, but the order number +
// email pair acts as the shared secret needed to access the PDF.
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const orderNumber = typeof body?.orderNumber === 'string' ? body.orderNumber.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    if (!orderNumber || !email) {
      return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 })
    }

    const order = await Order.findOne({
      orderNumber: new RegExp(`^${orderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      userEmail: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).lean()

    if (!order) {
      return NextResponse.json(
        { error: "We couldn't find an order matching that order number and email." },
        { status: 404 }
      )
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
    console.error('Guest invoice generation error:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
