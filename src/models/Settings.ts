import mongoose, { Document, Schema } from 'mongoose'

export interface ISettings extends Document {
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)
