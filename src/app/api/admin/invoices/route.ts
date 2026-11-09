import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { requireAdminApi } from '@/lib/require-admin'
import { connectDB } from '@/lib/mongodb'
import AdminInvoice from '@/models/AdminInvoice'
import { invoiceError, invoiceText, linkInvoiceOrder, prepareAdminInvoice, readInvoiceJson, privateInvoiceHeaders as headers } from '@/lib/admin-invoices'

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  try {
    if (!await connectDB()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers })
    const page = Math.min(10000, Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1))
    const search = (request.nextUrl.searchParams.get('search') || '').trim().slice(0, 160)
    const kind = request.nextUrl.searchParams.get('kind')
    const filter: Record<string, unknown> = {}
    if (kind === 'generated' || kind === 'external') filter.kind = kind
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = ['number', 'customerName', 'customerEmail', 'linkedOrderNumber', 'filename'].map(field => ({ [field]: regex }))
    }
    const [items, total] = await Promise.all([
      AdminInvoice.find(filter).select('number kind customerName customerEmail linkedOrderNumber revision savedAt savedBy filename data.total')
        .sort({ savedAt: -1, _id: -1 }).skip((Math.floor(page) - 1) * 20).limit(20).lean(),
      AdminInvoice.countDocuments(filter),
    ])
    return NextResponse.json({ items, total, page: Math.floor(page), pages: Math.max(1, Math.ceil(total / 20)) }, { headers })
  } catch (error) { return invoiceError(error) }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  try {
    const body = await readInvoiceJson(request)
    const reason = invoiceText(body.reason, 'reason', 500)
    if (!await connectDB()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers })
    const id = new mongoose.Types.ObjectId()
    const number = `ADM-${id.toString().toUpperCase()}`
    const data = await prepareAdminInvoice(body.data, { orderNumber: number, createdAt: new Date().toISOString() })
    const linkedOrder = await linkInvoiceOrder(body.linkedOrderNumber)
    await AdminInvoice.create({ _id: id, kind: 'generated', number, data, ...linkedOrder,
      customerName: data.userName, customerEmail: data.userEmail, revision: 1, savedAt: new Date(),
      savedBy: auth.user.email || auth.user.id, reason, history: [] })
    return NextResponse.json({ id: String(id), number, revision: 1 }, { status: 201, headers })
  } catch (error) { return invoiceError(error) }
}
