import { requestScopedModel } from '@/lib/mongodb'
import mongoose, { Document, Schema } from 'mongoose'

export interface ISubscriber extends Document {
  email: string
  subscribedAt: Date
  welcomeEmailStatus?: 'pending' | 'accepted' | 'failed'
  welcomeEmailAttemptAt?: Date
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    welcomeEmailStatus: { type: String, enum: ['pending', 'accepted', 'failed'] },
    welcomeEmailAttemptAt: Date,
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

export default requestScopedModel(mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema))
