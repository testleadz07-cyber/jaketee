import mongoose, { Schema } from 'mongoose'
import { requestScopedModel } from '@/lib/mongodb'
import type { InvoiceOrderData } from '@/lib/invoice-pdf'

export interface InvoiceRevision {
  revision: number
  data: InvoiceOrderData
  savedAt: Date
  savedBy: string
  reason: string
}

interface InvoiceRecord {
  // Same ID as the order. The built-in _id index also serializes first saves.
  _id: mongoose.Types.ObjectId
  revision: number
  data: InvoiceOrderData
  savedAt: Date
  savedBy: string
  reason: string
  history: InvoiceRevision[]
}

const RevisionSchema = new Schema<InvoiceRevision>({
  revision: { type: Number, required: true }, data: { type: Schema.Types.Mixed, required: true },
  savedAt: { type: Date, required: true }, savedBy: { type: String, required: true }, reason: { type: String, required: true },
}, { _id: false })
const InvoiceSchema = new Schema<InvoiceRecord>({
  _id: { type: Schema.Types.ObjectId, required: true }, revision: { type: Number, required: true },
  data: { type: Schema.Types.Mixed, required: true }, savedAt: { type: Date, required: true },
  savedBy: { type: String, required: true }, reason: { type: String, required: true },
  history: { type: [RevisionSchema], default: [] },
})

export default requestScopedModel(mongoose.models.Invoice || mongoose.model<InvoiceRecord>('Invoice', InvoiceSchema))
