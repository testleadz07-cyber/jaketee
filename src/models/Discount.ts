import mongoose, { Document, Schema } from 'mongoose'

export interface IDiscount extends Document {
  code: string
  discountType: 'percentage' | 'fixed' | 'free_shipping'
  discountValue: number
  minOrderValue: number
  startDate?: Date
  endDate?: Date
  usageLimit?: number | null
  usageCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const DiscountSchema = new Schema<IDiscount>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed', 'free_shipping'],
    },
    discountValue: {
      type: Number,
      required: true,
      default: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Discount || mongoose.model<IDiscount>('Discount', DiscountSchema)
