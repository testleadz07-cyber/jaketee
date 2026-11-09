import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import Order from '@/models/Order'
import type { AdminInvoiceRecord, AdminInvoiceVersion } from '@/models/AdminInvoice'
import { validateInvoiceEdit } from './invoice-data'
import { generateInvoicePdf, type InvoiceOrderData } from './invoice-pdf'
import { boundedText, RequestBodyTooLarge } from './request-body'

export const privateInvoiceHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
export const MAX_INVOICE_PDF_BYTES = 5 * 1024 * 1024
export class InvoiceInputError extends Error {}
export function invoiceError(error: unknown) {
  if (error instanceof RequestBodyTooLarge) return NextResponse.json({ error: 'Upload or request is too large.' }, { status: 413, headers: privateInvoiceHeaders })
  if (error instanceof InvoiceInputError) return NextResponse.json({ error: error.message }, { status: 400, headers: privateInvoiceHeaders })
  if ((error as { code?: number })?.code === 11000) return invoiceConflict()
  return NextResponse.json({ error: 'Could not process invoice. Please try again.' }, { status: 500, headers: privateInvoiceHeaders })
}
export function invoiceConflict() {
  return NextResponse.json({ error: 'This invoice changed in another session. Close and reopen it before saving.' }, { status: 409, headers: privateInvoiceHeaders })
}
export async function readInvoiceJson(request: Request) {
  try {
    const body = JSON.parse(await boundedText(request, 256 * 1024))
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InvoiceInputError('Invalid request.')
    return body
  } catch (error) {
    if (error instanceof RequestBodyTooLarge || error instanceof InvoiceInputError) throw error
    throw new InvoiceInputError('Invalid JSON request.')
  }
}
export function invoiceText(value: unknown, label: string, max: number, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim()) || /[\x00-\x1f\x7f]/.test(value)) throw new InvoiceInputError(`Invalid ${label}.`)
  return value.trim()
}
export function invoiceEmail(value: unknown) {
  const email = invoiceText(value, 'customer email', 254)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InvoiceInputError('Invalid customer email.')
  return email
}
export function checkRevision(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new InvoiceInputError('Invalid revision.')
  return Number(value)
}
export function checkInvoiceId(value: string) {
  if (!/^[a-f\d]{24}$/i.test(value)) throw new InvoiceInputError('Invalid invoice ID.')
  return new mongoose.Types.ObjectId(value)
}
export async function linkInvoiceOrder(value: unknown) {
  const number = invoiceText(value ?? '', 'order number', 80, false)
  if (!number) return {}
  const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const order = await Order.findOne({ orderNumber: new RegExp(`^${escaped}$`, 'i') }).select('_id orderNumber').lean()
  if (!order) throw new InvoiceInputError('Order number not found. Leave it blank for a standalone invoice.')
  return { linkedOrderId: (order as any)._id, linkedOrderNumber: (order as any).orderNumber as string }
}
export async function prepareAdminInvoice(input: unknown, identity: Pick<InvoiceOrderData, 'orderNumber' | 'createdAt'>) {
  try {
    const data = validateInvoiceEdit(input, identity as InvoiceOrderData)
    await generateInvoicePdf(data, { standalone: true })
    return data
  } catch (error) {
    throw new InvoiceInputError(error instanceof Error && !error.message.includes('WinAnsi') ? error.message : 'Some characters cannot be displayed. Please use Latin text.')
  }
}
export function invoiceVersion(record: AdminInvoiceVersion): AdminInvoiceVersion {
  return { revision: record.revision, data: record.data, fileId: record.fileId, filename: record.filename,
    savedAt: record.savedAt, savedBy: record.savedBy, reason: record.reason }
}
export function invoiceDetails(record: AdminInvoiceRecord) {
  const summary = (version: AdminInvoiceVersion) => ({ revision: version.revision, filename: version.filename,
    savedAt: version.savedAt, savedBy: version.savedBy, reason: version.reason })
  return { id: String(record._id), number: record.number, kind: record.kind, revision: record.revision,
    data: record.data, customerName: record.customerName, customerEmail: record.customerEmail,
    linkedOrderNumber: record.linkedOrderNumber, filename: record.filename,
    history: [...record.history.map(summary), summary(record)].reverse() }
}
export function invoicePdfResponse(bytes: Uint8Array, number: string, revision: number) {
  const safeNumber = number.replace(/[^a-z\d-]/gi, '_')
  return new NextResponse(Buffer.from(bytes), { headers: { ...privateInvoiceHeaders,
    'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="invoice-${safeNumber}-r${revision}.pdf"` } })
}
export async function validateExternalPdf(file: unknown) {
  if (!(file instanceof File) || file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name)) throw new InvoiceInputError('Choose a PDF file.')
  if (!file.size || file.size > MAX_INVOICE_PDF_BYTES) throw new InvoiceInputError('PDF must be between 1 byte and 5 MB.')
  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new InvoiceInputError('The file is not a valid PDF.')
  try {
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false })
    if (pdf.isEncrypted || !pdf.getPageCount() || pdf.getPageCount() > 200) throw new Error('Invalid pages')
  } catch { throw new InvoiceInputError('Choose a valid, unencrypted PDF with 1–200 pages.') }
  return { bytes, filename: file.name.replace(/[^a-z\d ._()-]/gi, '_').slice(0, 180) }
}
