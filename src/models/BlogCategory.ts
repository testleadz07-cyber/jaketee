import mongoose, { Document, Schema } from 'mongoose'

export interface IBlogCategory extends Document {
  name: string
  slug: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

const BlogCategorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
)

export default mongoose.models.BlogCategory ||
  mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema)
