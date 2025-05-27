import mongoose, { Document, Schema } from 'mongoose';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_UPDATE = 'profile_update',
  PASSWORD_CHANGE = 'password_change',
  BILL_CREATE = 'bill_create',
  BILL_UPDATE = 'bill_update',
  BILL_DELETE = 'bill_delete',
  QUOTATION_CREATE = 'quotation_create',
  QUOTATION_UPDATE = 'quotation_update',
  QUOTATION_DELETE = 'quotation_delete',
  INVENTORY_CREATE = 'inventory_create',
  INVENTORY_UPDATE = 'inventory_update',
  INVENTORY_DELETE = 'inventory_delete',
  SETTINGS_UPDATE = 'settings_update',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data'
}

export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: ActivityType;
  description: string;
  metadata?: {
    resourceId?: string;
    resourceType?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
  timestamp: Date;
  createdAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(ActivityType),
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    resourceId: {
      type: String,
      trim: true
    },
    resourceType: {
      type: String,
      trim: true
    },
    oldValues: {
      type: Schema.Types.Mixed
    },
    newValues: {
      type: Schema.Types.Mixed
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false
});

// Create compound indexes for efficient queries
UserActivitySchema.index({ userId: 1, timestamp: -1 });
UserActivitySchema.index({ userId: 1, type: 1, timestamp: -1 });

// TTL index to automatically delete old activities (optional)
// UserActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

export default mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
