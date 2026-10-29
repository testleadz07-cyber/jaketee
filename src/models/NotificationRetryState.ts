import { requestScopedModel } from '@/lib/mongodb'
import mongoose, { Schema } from 'mongoose'

// One shared marker across admins and server instances; no timer or cron needed.
const schema = new Schema({
  _id: { type: String, required: true },
  day: { type: String, required: true },
  attemptedAt: { type: Date, required: true },
}, { versionKey: false })

export default requestScopedModel(mongoose.models.NotificationRetryState || mongoose.model('NotificationRetryState', schema))
