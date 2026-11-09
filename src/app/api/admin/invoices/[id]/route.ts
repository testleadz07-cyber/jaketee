import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/require-admin'
import { connectDB } from '@/lib/mongodb'
import AdminInvoice, { type AdminInvoiceRecord } from '@/models/AdminInvoice'
import AdminInvoiceFile from '@/models/AdminInvoiceFile'
import { generateInvoicePdf } from '@/lib/invoice-pdf'
import { invoiceFromOrder } from '@/lib/invoice-data'
import { checkInvoiceId, checkRevision, invoiceConflict, invoiceDetails, invoiceError, invoicePdfResponse, invoiceText,
  invoiceVersion, prepareAdminInvoice, readInvoiceJson, privateInvoiceHeaders as headers, InvoiceInputError } from '@/lib/admin-invoices'

type Context = { params: Promise<{ id: string }> }
export async function GET(request: NextRequest, { params }: Context) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  try {
    const id = checkInvoiceId((await params).id)
    if (!await connectDB()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers })
    const invoice = await AdminInvoice.findById(id).lean() as unknown as AdminInvoiceRecord | null
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404, headers })
    const version = request.nextUrl.searchParams.get('revision')
    if (version === null) return NextResponse.json(invoiceDetails(invoice), { headers })
    if (!/^\d+$/.test(version)) throw new InvoiceInputError('Invalid revision.')
    const revision = checkRevision(Number(version))
    const snapshot = invoice.revision === revision ? invoice : invoice.history.find(entry => entry.revision === revision)
    if (!snapshot) return NextResponse.json({ error: 'Revision not found' }, { status: 404, headers })
    if (invoice.kind === 'generated' && snapshot.data) return invoicePdfResponse(await generateInvoicePdf(snapshot.data, { standalone: true }), invoice.number, revision)
    const file = await AdminInvoiceFile.findOne({ _id: snapshot.fileId, invoiceId: invoice._id }).select('+bytes').lean()
    if (!file) return NextResponse.json({ error: 'PDF not found' }, { status: 404, headers })
    const stored = (file as any).bytes
    // Lean MongoDB reads may return BSON Binary rather than a Mongoose Buffer.
    const bytes = Buffer.isBuffer(stored) ? stored : stored?._bsontype === 'Binary' ? stored.value() : stored
    return invoicePdfResponse(bytes, invoice.number, revision)
  } catch (error) { return invoiceError(error) }
}

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  try {
    const id = checkInvoiceId((await params).id)
    const body = await readInvoiceJson(request)
    const revision = checkRevision(body.revision), reason = invoiceText(body.reason, 'reason', 500)
    if (!await connectDB()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers })
    const invoice = await AdminInvoice.findById(id).lean() as unknown as AdminInvoiceRecord | null
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404, headers })
    if (invoice.kind !== 'generated' || !invoice.data) throw new InvoiceInputError('Use Upload new version for an external PDF.')
    if (invoice.revision !== revision) return invoiceConflict()
    const data = await prepareAdminInvoice(body.data, invoice.data)
    if (JSON.stringify(invoiceFromOrder(data)) === JSON.stringify(invoiceFromOrder(invoice.data))) throw new InvoiceInputError('No invoice changes to save.')
    const result = await AdminInvoice.updateOne({ _id: id, revision }, { $set: { data, customerName: data.userName,
      customerEmail: data.userEmail, revision: revision + 1, savedAt: new Date(), savedBy: auth.user.email || auth.user.id, reason },
      $push: { history: invoiceVersion(invoice) } }, { runValidators: true })
    if (!result.matchedCount) return invoiceConflict()
    return NextResponse.json({ revision: revision + 1 }, { headers })
  } catch (error) { return invoiceError(error) }
}
