import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreSettings extends Document {
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export default mongoose.models.StoreSettings || mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);
