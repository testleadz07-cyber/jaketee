import mongoose, { Document, Schema } from 'mongoose'

export type NotificationType = 'user_registered' | 'contact_form' | 'refund_request' | 'newsletter_signup'

export interface INotification extends Document {
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  metadata?: Record<string, any>
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['user_registered', 'contact_form', 'refund_request', 'newsletter_signup'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

NotificationSchema.index({ read: 1, createdAt: -1 })
NotificationSchema.index({ type: 1, createdAt: -1 })

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
