import { requestScopedModel } from '@/lib/mongodb'
import mongoose, { Document, Schema } from 'mongoose'

export interface IContactMessage extends Document {
  name: string
  email: string
  subject: string
  message: string
  attachments?: { filename: string; contentType: string; content: Buffer }[]
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    attachments: [{ filename: String, contentType: String, content: Buffer }],
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

ContactMessageSchema.index({ createdAt: -1 })

export default requestScopedModel(mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema))
