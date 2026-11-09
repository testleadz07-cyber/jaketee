import mongoose, { Schema } from 'mongoose'
import { requestScopedModel } from '@/lib/mongodb'
import type { InvoiceOrderData } from '@/lib/invoice-pdf'

export interface AdminInvoiceVersion {
  revision: number
  data?: InvoiceOrderData
  fileId?: mongoose.Types.ObjectId
  filename?: string
  savedAt: Date
  savedBy: string
  reason: string
}

export interface AdminInvoiceRecord extends AdminInvoiceVersion {
  _id: mongoose.Types.ObjectId
  kind: 'generated' | 'external'
  number: string
  customerName: string
  customerEmail: string
  linkedOrderId?: mongoose.Types.ObjectId
  linkedOrderNumber?: string
  history: AdminInvoiceVersion[]
}

const versionFields = {
  revision: { type: Number, required: true }, data: { type: Schema.Types.Mixed },
  fileId: { type: Schema.Types.ObjectId }, filename: String,
  savedAt: { type: Date, required: true }, savedBy: { type: String, required: true }, reason: { type: String, required: true },
}
const VersionSchema = new Schema(versionFields, { _id: false })
const AdminInvoiceSchema = new Schema<AdminInvoiceRecord>({
  ...versionFields,
  kind: { type: String, enum: ['generated', 'external'], required: true },
  number: { type: String, required: true }, customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  linkedOrderId: Schema.Types.ObjectId, linkedOrderNumber: String,
  history: { type: [VersionSchema], default: [] },
})
AdminInvoiceSchema.index({ savedAt: -1, _id: -1 })

// Separate from customer-facing order invoices: these records are admin-only.
export default requestScopedModel(mongoose.models.AdminInvoice || mongoose.model<AdminInvoiceRecord>('AdminInvoice', AdminInvoiceSchema))
