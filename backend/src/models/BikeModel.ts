import mongoose, { Document, Schema } from 'mongoose';

export interface IBikeModel extends Document {
  name: string;
  price: number;
  motor_number_prefix: string;
  chassis_number_prefix: string;
  is_ebicycle: boolean;
  is_tricycle: boolean;
  can_be_leased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BikeModelSchema = new Schema<IBikeModel>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  motor_number_prefix: {
    type: String,
    required: [true, 'Motor number prefix is required'],
    trim: true
  },
  chassis_number_prefix: {
    type: String,
    required: [true, 'Chassis number prefix is required'],
    trim: true
  },
  is_ebicycle: {
    type: Boolean,
    default: false
  },
  is_tricycle: {
    type: Boolean,
    default: false
  },
  can_be_leased: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  collection: 'bike_models' // Explicitly set the collection name
});

// Create a text index for search
BikeModelSchema.index({ name: 'text' });

// Add middleware to handle tricycle models
BikeModelSchema.pre('save', function(next) {
  // If this is a tricycle, ensure it can't be leased and isn't marked as ebicycle
  if (this.is_tricycle) {
    this.can_be_leased = false;
    // Note: We don't set is_ebicycle to false in case it's possible to have a tricycle e-bicycle
  }
  next();
});

export default mongoose.model<IBikeModel>('BikeModel', BikeModelSchema); 