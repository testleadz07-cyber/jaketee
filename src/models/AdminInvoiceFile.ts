import mongoose, { Schema } from 'mongoose'
import { requestScopedModel } from '@/lib/mongodb'

// Bounded PDFs live in private storage, never in the storefront's public media service.
// Separate documents keep immutable file revisions below MongoDB's document limit.
const schema = new Schema({
  invoiceId: { type: Schema.Types.ObjectId, required: true },
  bytes: { type: Buffer, required: true, select: false },
})
export default requestScopedModel(mongoose.models.AdminInvoiceFile || mongoose.model('AdminInvoiceFile', schema))
