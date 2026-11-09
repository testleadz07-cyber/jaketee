import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { requireAdminApi } from '@/lib/require-admin'
import { connectDB } from '@/lib/mongodb'
import AdminInvoice, { type AdminInvoiceRecord } from '@/models/AdminInvoice'
import AdminInvoiceFile from '@/models/AdminInvoiceFile'
import { boundedFormData } from '@/lib/request-body'
import { checkInvoiceId, checkRevision, invoiceConflict, invoiceEmail, invoiceError, invoiceText, invoiceVersion,
  linkInvoiceOrder, MAX_INVOICE_PDF_BYTES, privateInvoiceHeaders as headers, validateExternalPdf, InvoiceInputError } from '@/lib/admin-invoices'

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth.response) return auth.response
  // A failed metadata save must not leave an unreachable private file behind.
  let createdFileId: mongoose.Types.ObjectId | undefined
  try {
    const form = await boundedFormData(request, MAX_INVOICE_PDF_BYTES + 64 * 1024)
    const reason = invoiceText(form.get('reason'), 'reason', 500)
    const { bytes, filename } = await validateExternalPdf(form.get('file'))
    const requestedId = form.get('invoiceId')
    if (requestedId !== null && typeof requestedId !== 'string') throw new InvoiceInputError('Invalid invoice ID.')
    const id = requestedId ? checkInvoiceId(requestedId) : new mongoose.Types.ObjectId()
    const revision = requestedId ? checkRevision(Number(form.get('revision'))) : 0
    if (!await connectDB()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers })
    let existing: AdminInvoiceRecord | null = null
    let metadata: Record<string, unknown> = {}
    if (requestedId) {
      existing = await AdminInvoice.findById(id).lean() as unknown as AdminInvoiceRecord | null
      if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404, headers })
      if (existing.kind !== 'external') throw new InvoiceInputError('Upload this PDF as a separate external invoice.')
      if (existing.revision !== revision) return invoiceConflict()
    } else {
      metadata = { customerName: invoiceText(form.get('customerName'), 'customer name', 160), customerEmail: invoiceEmail(form.get('customerEmail')),
        ...await linkInvoiceOrder(form.get('linkedOrderNumber')) }
    }
    const fileId = new mongoose.Types.ObjectId()
    await AdminInvoiceFile.create({ _id: fileId, invoiceId: id, bytes })
    createdFileId = fileId
    const next = { revision: revision + 1, fileId, filename, savedAt: new Date(), savedBy: auth.user.email || auth.user.id, reason }
    if (existing) {
      const result = await AdminInvoice.updateOne({ _id: id, revision }, { $set: next, $push: { history: invoiceVersion(existing) } }, { runValidators: true })
      if (!result.matchedCount) {
        await AdminInvoiceFile.deleteOne({ _id: fileId })
        createdFileId = undefined
        return invoiceConflict()
      }
    } else {
      await AdminInvoice.create({ _id: id, kind: 'external', number: `EXT-${id.toString().toUpperCase()}`, ...metadata, ...next, history: [] })
    }
    createdFileId = undefined
    return NextResponse.json({ id: String(id), revision: next.revision }, { status: existing ? 200 : 201, headers })
  } catch (error) {
    if (createdFileId) {
      // A network failure can occur after MongoDB committed the metadata write.
      // Only remove the new file if we can prove no saved revision references it.
      try {
        const referenced = await AdminInvoice.exists({ $or: [{ fileId: createdFileId }, { 'history.fileId': createdFileId }] })
        if (!referenced) await AdminInvoiceFile.deleteOne({ _id: createdFileId })
      } catch { /* Retain the private file if the database cannot confirm ownership. */ }
    }
    return invoiceError(error)
  }
}
