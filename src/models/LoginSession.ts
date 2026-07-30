import mongoose, { Document, Schema } from 'mongoose'

export interface ILoginSession extends Document {
  userId: mongoose.Types.ObjectId
  loginAt: Date
  logoutAt?: Date
  lastSeenAt: Date
  durationSeconds?: number
  ip?: string
  userAgent?: string
  country?: string
  sessionToken?: string // hashed JTI for uniqueness / lookup
}

const LoginSessionSchema = new Schema<ILoginSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loginAt: { type: Date, required: true, default: Date.now },
    logoutAt: { type: Date },
    lastSeenAt: { type: Date, default: Date.now },
    durationSeconds: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
    country: { type: String },
    sessionToken: { type: String, index: true, sparse: true },
  },
  { timestamps: false }
)

LoginSessionSchema.index({ userId: 1, loginAt: -1 })
LoginSessionSchema.index({ loginAt: -1 })
LoginSessionSchema.index({ logoutAt: 1, lastSeenAt: 1 }) // for "active now" queries

export default mongoose.models.LoginSession ||
  mongoose.model<ILoginSession>('LoginSession', LoginSessionSchema)
