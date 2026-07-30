import mongoose, { Document, Schema } from 'mongoose'

export interface IProductImage {
  url: string
  alt?: string
  order: number
}

export interface IProductVariant {
  name: string
  value: string
  priceAdjust: number
  inStock: boolean
  image?: string
}

export interface IProductEmbroidery {
  available: boolean
  fee: number
  maxChars: number
}

export interface IProduct extends Document {
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  categoryId: mongoose.Types.ObjectId
  category?: { _id: string; name: string; slug: string }
  images: IProductImage[]
  variants: IProductVariant[]
  embroidery?: IProductEmbroidery
  measurementFields?: string[]
  averageRating: number
  reviewCount: number
  isFeatured: boolean
  inStock: boolean
  stockCount?: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const ProductImageSchema = new Schema<IProductImage>(
  { url: { type: String, required: true }, alt: { type: String }, order: { type: Number, default: 0 } },
  { _id: false }
)

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    priceAdjust: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    image: { type: String },
  },
  { _id: false }
)

const ProductEmbroiderySchema = new Schema<IProductEmbroidery>(
  {
    available: { type: Boolean, default: false },
    fee: { type: Number, default: 0 },
    maxChars: { type: Number, default: 20 },
  },
  { _id: false }
)

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [ProductImageSchema],
    variants: [ProductVariantSchema],
    embroidery: { type: ProductEmbroiderySchema },
    measurementFields: { type: [String], default: [] },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 100 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
)

ProductSchema.index({ name: 'text', description: 'text' })

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)