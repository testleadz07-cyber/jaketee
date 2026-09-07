import mongoose, { Document, Schema } from 'mongoose'

export interface IFaq extends Document {
  question: string
  answer: string[]
  category: string
  bullets: string[]
  ordered: string[]
  image?: { src: string; alt: string }
  order: number
  displayPages: string[]
  createdAt: Date
  updatedAt: Date
}

const FaqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true },
    answer: { type: [String], default: [] },
    category: { type: String, required: true },
    bullets: { type: [String], default: [] },
    ordered: { type: [String], default: [] },
    image: {
      src: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    order: { type: Number, default: 0 },
    displayPages: { type: [String], default: [] },
  },
  { timestamps: true }
)

FaqSchema.index({ category: 1, order: 1 })
FaqSchema.index({ displayPages: 1 })

export default mongoose.models.Faq || mongoose.model<IFaq>('Faq', FaqSchema)
