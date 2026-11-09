import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { requireAdminApi } from '@/lib/require-admin'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Invoice, { type InvoiceRevision } from '@/models/Invoice'
import { invoiceFromOrder, validateInvoiceEdit } from '@/lib/invoice-data'
import { generateInvoicePdf, type InvoiceOrderData } from '@/lib/invoice-pdf'

const headers = { 'Cache-Control': 'private, no-store' }
type Context = { params: Promise<{ id: string }> }
type SavedInvoice = InvoiceRevision & { history: InvoiceRevision[] }
const conflict = () => NextResponse.json({ error: 'This invoice changed in another session. Close and reopen the editor before saving.' }, { status: 409, headers })

export async function GET(request: NextRequest, { params }: Context) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  try {
    const { id } = await params
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400, headers })
    if (!await connectDB()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers })
    const order = await Order.findById(id).lean()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404, headers })
    const saved = await Invoice.findById(id).lean() as unknown as SavedInvoice | null
    const current = saved?.data || invoiceFromOrder(order as unknown as InvoiceOrderData)
    const version = request.nextUrl.searchParams.get('revision')
    if (version !== null) {
      if (!/^\d+$/.test(version)) return NextResponse.json({ error: 'Invalid revision' }, { status: 400, headers })
      const revision = Number(version)
      const data = revision === (saved?.revision || 0) ? current : saved?.history.find(entry => entry.revision === revision)?.data
      if (!data) return NextResponse.json({ error: 'Revision not found' }, { status: 404, headers })
      return new NextResponse(Buffer.from(await generateInvoicePdf(data)), { headers: { ...headers,
        'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="invoice-${current.orderNumber}-r${revision}.pdf"` } })
    }
    const summary = ({ revision, savedAt, savedBy, reason }: InvoiceRevision) => ({ revision, savedAt, savedBy, reason })
    return NextResponse.json({ data: current, revision: saved?.revision || 0,
      history: saved ? [...saved.history.map(summary), summary(saved)].reverse() : [] }, { headers })
  } catch {
    return NextResponse.json({ error: 'Could not load invoice.' }, { status: 500, headers })
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  try {
    const { id } = await params
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400, headers })
    let body
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers }) }
    if (!body || !Number.isSafeInteger(body.revision) || body.revision < 0 || typeof body.reason !== 'string' || !body.reason.trim() || body.reason.trim().length > 500) {
      return NextResponse.json({ error: 'A revision and a reason (1–500 characters) are required.' }, { status: 400, headers })
    }
    if (!await connectDB()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers })
    const order = await Order.findById(id).lean()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404, headers })
    const saved = await Invoice.findById(id).lean() as unknown as SavedInvoice | null
    if ((saved?.revision || 0) !== body.revision) return conflict()
    const original = saved?.data || invoiceFromOrder(order as unknown as InvoiceOrderData)
    let data: InvoiceOrderData
    try {
      data = validateInvoiceEdit(body.data, original)
      // Reject unsupported PDF characters and unrenderable changes before persisting.
      await generateInvoicePdf(data)
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error && !error.message.includes('WinAnsi') ? error.message : 'Some characters cannot be displayed in this invoice. Please use Latin text.' }, { status: 400, headers })
    }
    if (JSON.stringify(invoiceFromOrder(data)) === JSON.stringify(invoiceFromOrder(original))) return NextResponse.json({ error: 'No invoice changes to save.' }, { status: 400, headers })
    const next = { revision: body.revision + 1, data, savedAt: new Date(), savedBy: auth.user.email || auth.user.id, reason: body.reason.trim() }
    if (!saved) {
      await Invoice.create({ _id: id, ...next, history: [{ revision: 0, data: original, savedAt: next.savedAt, savedBy: next.savedBy, reason: 'Original invoice before first edit' }] })
    } else {
      const result = await Invoice.updateOne({ _id: id, revision: body.revision }, {
        $set: next, $push: { history: { revision: saved.revision, data: saved.data, savedAt: saved.savedAt, savedBy: saved.savedBy, reason: saved.reason } },
      }, { runValidators: true })
      if (!result.matchedCount) return conflict()
    }
    return NextResponse.json({ revision: next.revision }, { headers })
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return conflict()
    return NextResponse.json({ error: 'Could not save invoice. Please try again.' }, { status: 500, headers })
  }
}
