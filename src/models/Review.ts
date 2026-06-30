import mongoose, { Document, Schema } from 'mongoose'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  userName: string
  rating: number
  title?: string
  comment: string
  isVerified: boolean
  images?: string[]
  videos?: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
)

ReviewSchema.index({ productId: 1, createdAt: -1 })
ReviewSchema.index({ productId: 1, status: 1 })

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)