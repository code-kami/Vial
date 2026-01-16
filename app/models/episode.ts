import mongoose, { Schema, Document } from "mongoose";

// episode.ts - Update the interface and schema
export interface IEpisode extends Document {
  title: string;
  description: string;
  status: "draft" | "scheduled" | "published";
  uploadDate: string;
  duration: string;
  listens: number;
  topic: string;
  publishDate?: string;
  publishTime?: string;
  scheduledDate?: string;
  scheduleTime?: string;

  // Cloudinary audio data
  audioUrl?: string;
  audioPublicId?: string;
  audioFileName?: string;
  audioSize?: number;
  audioDuration?: number;
  audioFormat?: string;
  
  // For backward compatibility
  audioId?: string;
  
  coverImage?: string;
  createdBy?: string;
  isPublic?: boolean; // Add this field to control visibility
  createdAt: Date;
  updatedAt: Date;
}

// app/models/episode.ts - Update the schema validation
const EpisodeSchema: Schema = new Schema(
  {
    id: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined for backward compatibility
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "scheduled", "published"],
        message: "{VALUE} is not a valid status",
      },
      default: "draft",
    },
    uploadDate: {
      type: String,
      required: [true, "Upload date is required"],
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
    },
    listens: {
      type: Number,
      default: 0,
      min: [0, "Listens cannot be negative"],
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
    },
    publishDate: {
      type: String,
      validate: {
        validator: function(value: string) {
          if (!value) return true; // Optional
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        },
        message: "Publish date must be in YYYY-MM-DD format",
      },
    },
    publishTime: {
      type: String,
      validate: {
        validator: function(value: string) {
          if (!value) return true; // Optional
          return /^\d{2}:\d{2}$/.test(value);
        },
        message: "Publish time must be in HH:MM format",
      },
    },
    // Cloudinary audio data
    audioUrl: { type: String },
    audioPublicId: { type: String },
    audioFileName: { type: String },
    audioSize: { type: Number },
    audioDuration: { type: Number },
    audioFormat: { type: String },
    audioId: { type: String },

    coverImage: { type: String },
    createdBy: { type: String },
    isPublic: { 
      type: Boolean, 
      default: true 
    },
  },
  {
    timestamps: true,
    // Better error messages
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
export default mongoose.models.Episode ||
  mongoose.model<IEpisode>("Episode", EpisodeSchema);
