import mongoose, { Schema } from 'mongoose'

const SectionImageSchema = new Schema({
  section: { type: String, required: true },
  key: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  originalUrl: String,
  alt: { type: String, required: true },
  width: Number,
  height: Number,
  watermark: String,
}, { timestamps: true })

SectionImageSchema.index({ section: 1, key: 1 }, { unique: true })

export default mongoose.models.SectionImage || mongoose.model('SectionImage', SectionImageSchema)
