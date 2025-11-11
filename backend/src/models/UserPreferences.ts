import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    browser: boolean;
    billReminders: boolean;
    quotationUpdates: boolean;
    systemUpdates: boolean;
  };
  dashboard: {
    defaultView: 'bills' | 'quotations' | 'inventory' | 'dashboard';
    itemsPerPage: number;
    showWelcomeMessage: boolean;
  };
  privacy: {
    profileVisibility: 'private' | 'team' | 'public';
    activityTracking: boolean;
    dataRetention: number; // days
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  language: {
    type: String,
    default: 'en',
    trim: true
  },
  timezone: {
    type: String,
    default: 'Asia/Colombo',
    trim: true
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    browser: {
      type: Boolean,
      default: true
    },
    billReminders: {
      type: Boolean,
      default: true
    },
    quotationUpdates: {
      type: Boolean,
      default: true
    },
    systemUpdates: {
      type: Boolean,
      default: false
    }
  },
  dashboard: {
    defaultView: {
      type: String,
      enum: ['bills', 'quotations', 'inventory', 'dashboard'],
      default: 'dashboard'
    },
    itemsPerPage: {
      type: Number,
      default: 10,
      min: 5,
      max: 100
    },
    showWelcomeMessage: {
      type: Boolean,
      default: true
    }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['private', 'team', 'public'],
      default: 'private'
    },
    activityTracking: {
      type: Boolean,
      default: true
    },
    dataRetention: {
      type: Number,
      default: 365, // 1 year
      min: 30,
      max: 2555 // 7 years
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Note: userId already has a unique index from the unique: true constraint above

export default mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
