import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreSettings extends Document {
  lowStockThreshold: number;
  reviewRequestDelayDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    lowStockThreshold: { type: Number, default: 5 },
    reviewRequestDelayDays: { type: Number, default: 7, min: 0, max: 90 },
  },
  { timestamps: true }
);

export default mongoose.models.StoreSettings || mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);
