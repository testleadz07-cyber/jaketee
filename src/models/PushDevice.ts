import mongoose, { Schema } from 'mongoose'

const PushDeviceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loginSessionId: { type: Schema.Types.ObjectId, ref: 'LoginSession', required: true },
  token: { type: String, required: true, unique: true },
  lastSeenAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true })

export default mongoose.models.PushDevice || mongoose.model('PushDevice', PushDeviceSchema)
