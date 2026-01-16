import mongoose, {Document } from "mongoose";
import { model, models, Schema } from "mongoose";


export interface ISubscriber extends Document {
  name: string;
  email: string;
  passwordHash: string;
  username?: string;
  bio?: string;
  favoriteTopic?: string;
  avatarId?: number;
  avatarUrl?: string;
  notifications?: boolean;
  newsletter?: boolean;
  episodesCompleted?: number;
  totalTime?: number; // in seconds
  status: "active" | "inactive";
  joinDate: Date;
  lastLogin?: Date;
  loginCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
    },
    bio: {
      type: String,
      default: "Intentional listener exploring quiet forces.",
    },
    favoriteTopic: {
      type: String,
      default: "Inner Order",
    },
    avatarId: {
      type: Number,
      default: 1,
    },
    avatarUrl: {
      type: String,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    newsletter: {
      type: Boolean,
      default: true,
    },
    episodesCompleted: {
      type: Number,
      default: 0,
    },
    totalTime: {
      type: Number, // in seconds
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const SubscriberModel = models.Subscriber || model<ISubscriber>("Subscriber", SubscriberSchema);

export default SubscriberModel;
