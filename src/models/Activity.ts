import mongoose, { Document, Schema } from 'mongoose'

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId
  action: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
  country?: string
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    country: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

ActivitySchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)
