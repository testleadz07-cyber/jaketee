import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: 'admin' | 'customer'
  phone?: string
  avatar?: string
  addresses: Array<{
    label: string
    name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
    phone?: string
    isDefault: boolean
  }>
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema(
  {
    label: { type: String, default: 'Home' },
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'United States' },
    phone: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    phone: { type: String },
    avatar: { type: String },
    addresses: [AddressSchema],
  },
  { timestamps: true }
)

UserSchema.index({ email: 1 })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)