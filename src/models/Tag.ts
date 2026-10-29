import { requestScopedModel } from '@/lib/mongodb'
import mongoose, { Schema } from 'mongoose'

const TagSchema = new Schema({ name: { type: String, required: true, unique: true, trim: true } }, { timestamps: true })
export default requestScopedModel(mongoose.models.Tag || mongoose.model('Tag', TagSchema))
