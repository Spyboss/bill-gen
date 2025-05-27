import mongoose, { Document, Schema } from 'mongoose';

export interface IBikeModel extends Document {
  name: string;
  price: number;
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
  // motor_number_prefix: { // Removed
  //   type: String,
  //   trim: true
  // },
  // chassis_number_prefix: { // Removed
  //   type: String,
  //   trim: true
  // },
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
  // If this is a tricycle or an e-bicycle, it cannot be leased.
  if (this.is_tricycle || this.is_ebicycle) {
    this.can_be_leased = false;
  }
  // If it's not a tricycle and not an e-bicycle, it can be leased by default (unless specified otherwise).
  // However, the schema already defaults can_be_leased to true,
  // so we only need to explicitly set it to false under specific conditions.
  next();
});

export default mongoose.model<IBikeModel>('BikeModel', BikeModelSchema);
