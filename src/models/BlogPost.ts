import mongoose, { Document, Schema } from 'mongoose'

export type BlogPostStatus = 'draft' | 'scheduled' | 'published'

export interface IBlogPost extends Document {
  title: string
  slug: string
  excerpt: string
  content: string // sanitized HTML from rich text editor
  featuredImage?: string
  categories: mongoose.Types.ObjectId[]
  tags: string[]
  status: BlogPostStatus
  publishedAt?: Date
  author: {
    name: string
    userId?: mongoose.Types.ObjectId
  }
  seoTitle?: string
  seoDescription?: string
  ogImage?: string
  taggedProducts: mongoose.Types.ObjectId[]
  views: number
  createdAt: Date
  updatedAt: Date
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    featuredImage: { type: String },
    categories: [{ type: Schema.Types.ObjectId, ref: 'BlogCategory' }],
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft' },
    publishedAt: { type: Date },
    author: {
      name: { type: String, required: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    seoTitle: { type: String },
    seoDescription: { type: String },
    ogImage: { type: String },
    taggedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
)

BlogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' })
BlogPostSchema.index({ status: 1, publishedAt: -1 })

export default mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema)
