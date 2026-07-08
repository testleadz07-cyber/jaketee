import mongoose, { Document, Schema } from 'mongoose'

export interface IAbandonedCartItem {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  variants: Array<{ name: string; value: string }>
}

export interface IAbandonedCart extends Document {
  userId: mongoose.Types.ObjectId
  userEmail: string
  userName: string
  items: IAbandonedCartItem[]
  subtotal: number
  promoCode?: string
  // Tracks which reminder stages (in hours since last activity) have already been sent
  // so the cron job never emails the same stage twice for the same cart.
  remindersSent: number[]
  lastReminderAt?: Date
  recovered: boolean
  recoveredAt?: Date
  lastActivityAt: Date
  createdAt: Date
  updatedAt: Date
}

const AbandonedCartItemSchema = new Schema<IAbandonedCartItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    variants: [{ name: String, value: String }],
  },
  { _id: false }
)

const AbandonedCartSchema = new Schema<IAbandonedCart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    items: { type: [AbandonedCartItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    promoCode: { type: String },
    remindersSent: { type: [Number], default: [] },
    lastReminderAt: { type: Date },
    recovered: { type: Boolean, default: false },
    recoveredAt: { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

AbandonedCartSchema.index({ recovered: 1, lastActivityAt: 1 })

export default mongoose.models.AbandonedCart ||
  mongoose.model<IAbandonedCart>('AbandonedCart', AbandonedCartSchema)
