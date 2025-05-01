import mongoose, { Document, Schema } from 'mongoose';

export enum BikeStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RESERVED = 'reserved',
  DAMAGED = 'damaged'
}

export interface IBikeInventory extends Document {
  bikeModelId: mongoose.Types.ObjectId;
  motorNumber: string;
  chassisNumber: string;
  status: BikeStatus;
  dateAdded: Date;
  dateSold?: Date;
  billId?: mongoose.Types.ObjectId;
  notes?: string;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BikeInventorySchema = new Schema<IBikeInventory>({
  bikeModelId: {
    type: Schema.Types.ObjectId,
    ref: 'BikeModel',
    required: [true, 'Bike model is required']
  },
  motorNumber: {
    type: String,
    required: [true, 'Motor number is required'],
    trim: true,
    unique: true
  },
  chassisNumber: {
    type: String,
    required: [true, 'Chassis number is required'],
    trim: true,
    unique: true
  },
  status: {
    type: String,
    enum: Object.values(BikeStatus),
    default: BikeStatus.AVAILABLE
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  dateSold: {
    type: Date,
    default: null
  },
  billId: {
    type: Schema.Types.ObjectId,
    ref: 'Bill',
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  versionKey: false,
  collection: 'bike_inventory'
});

// Create indexes for faster queries
BikeInventorySchema.index({ bikeModelId: 1, status: 1 });
BikeInventorySchema.index({ motorNumber: 'text', chassisNumber: 'text' });

export default mongoose.model<IBikeInventory>('BikeInventory', BikeInventorySchema);
