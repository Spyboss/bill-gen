import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEmailVerificationStatus extends Document {
  user: Types.ObjectId;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailVerificationStatusSchema = new Schema<IEmailVerificationStatus>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date }
}, {
  timestamps: true,
  versionKey: false
});

EmailVerificationStatusSchema.index({ user: 1 }, { unique: true });

export default mongoose.model<IEmailVerificationStatus>('EmailVerificationStatus', EmailVerificationStatusSchema);