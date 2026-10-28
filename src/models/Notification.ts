import { requestScopedModel } from '@/lib/mongodb'
import mongoose, { Document, Schema } from 'mongoose'

export type NotificationType = 'user_registered' | 'contact_form' | 'refund_request' | 'newsletter_signup' | 'new_order' | 'payment_received'

export interface INotification extends Document {
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  metadata?: Record<string, any>
  eventKey?: string
  pushState?: 'pending' | 'sent'
  pushAttempts?: number
  pushNextAttemptAt?: Date
  pushLeaseUntil?: Date
  pushLeaseId?: string
  pushDeliveredTokens?: string[]
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['user_registered', 'contact_form', 'refund_request', 'newsletter_signup', 'new_order', 'payment_received'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
    eventKey: { type: String },
    pushState: { type: String, enum: ['pending', 'sent'] },
    pushAttempts: { type: Number, default: 0 },
    pushNextAttemptAt: { type: Date },
    pushLeaseUntil: { type: Date },
    pushLeaseId: { type: String },
    pushDeliveredTokens: { type: [String], select: false, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

NotificationSchema.index({ read: 1, createdAt: -1 })
NotificationSchema.index({ type: 1, createdAt: -1 })
NotificationSchema.index({ eventKey: 1 }, { unique: true, sparse: true })
NotificationSchema.index({ pushState: 1, pushNextAttemptAt: 1 })

export default requestScopedModel(mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema))
