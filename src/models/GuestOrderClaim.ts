import mongoose, { Schema } from 'mongoose'

const GuestOrderClaimSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

GuestOrderClaimSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
GuestOrderClaimSchema.index({ userId: 1, email: 1 })

export default mongoose.models.GuestOrderClaim || mongoose.model('GuestOrderClaim', GuestOrderClaimSchema)
