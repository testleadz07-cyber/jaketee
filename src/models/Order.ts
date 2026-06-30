import mongoose, { Document, Schema } from 'mongoose'

export interface IOrderItem {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  variants: Array<{ name: string; value: string }>
}

export interface IOrder extends Document {
  orderNumber: string
  userId: mongoose.Types.ObjectId
  userEmail: string
  userName: string
  items: IOrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  promoCode?: string
  discountAmount?: number
  status: 'pending' | 'paid' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled'
  paymentMethod: 'paypal' | 'stripe'
  paymentId?: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
    phone?: string
  }
  notes?: string
  trackingNumber?: string
  carrier?: 'UPS' | 'FedEx' | 'USPS' | 'DHL' | 'Other'
  estimatedDelivery?: Date
  statusHistory: Array<{ status: string; timestamp: Date; note?: string }>
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
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

const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
)

const ShippingAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'United States' },
    phone: { type: String },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    promoCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: { type: String, enum: ['paypal', 'stripe'], default: 'paypal' },
    paymentId: { type: String },
    shippingAddress: ShippingAddressSchema,
    notes: { type: String },
    trackingNumber: { type: String },
    carrier: { type: String, enum: ['UPS', 'FedEx', 'USPS', 'DHL', 'Other'] },
    estimatedDelivery: { type: Date },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
)

OrderSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)