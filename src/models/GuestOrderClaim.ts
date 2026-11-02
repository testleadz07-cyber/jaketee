import { requestScopedModel } from '@/lib/mongodb'
import mongoose, { Schema } from 'mongoose'

const GuestOrderClaimSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  consumedAt: Date,
  claimedCount: { type: Number, default: 0 },
}, { timestamps: true })

GuestOrderClaimSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
GuestOrderClaimSchema.index({ userId: 1, email: 1 })

if (mongoose.models.GuestOrderClaim && !mongoose.models.GuestOrderClaim.schema.path('consumedAt')) {
  mongoose.models.GuestOrderClaim.schema.add({ consumedAt: Date, claimedCount: { type: Number, default: 0 } })
}

export default requestScopedModel(mongoose.models.GuestOrderClaim || mongoose.model('GuestOrderClaim', GuestOrderClaimSchema))
