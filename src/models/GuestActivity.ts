import mongoose, { Document, Schema } from 'mongoose'

export interface IGuestActivity extends Document {
  guestId: string
  action: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
  country?: string
  createdAt: Date
}

const GuestActivitySchema = new Schema<IGuestActivity>(
  {
    guestId: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    country: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

GuestActivitySchema.index({ guestId: 1, createdAt: -1 })
GuestActivitySchema.index({ action: 1, createdAt: -1 })

export default mongoose.models.GuestActivity || mongoose.model<IGuestActivity>('GuestActivity', GuestActivitySchema)
