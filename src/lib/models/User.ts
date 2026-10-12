// Login accounts (humans). Anonymous browser accounts keep working for
// guests; on login their device charts can be adopted into the account.
import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String, required: true, trim: true, lowercase: true, maxlength: 160,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, default: null },
    image: { type: String, default: null },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel =
  (mongoose.models.AppUser as mongoose.Model<UserDoc> | undefined) ??
  mongoose.model<UserDoc>('AppUser', UserSchema);
