import mongoose, { Schema } from 'mongoose';
import { type IUser } from '../types/user.type';

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      select: false // Don't include password in queries by default
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret: Record<string, any>) => {
            delete ret.password;

            delete ret.__v;
            return ret;
        }
    }
  }
);

export const User = mongoose.model<IUser>('User', userSchema);

