import mongoose, { Document, Schema } from "mongoose";

export interface IStory extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  media: string;
  mediaPublicId?: string;
  type: "image" | "video";
  expiresAt: Date;
  viewers: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const storySchema = new Schema<IStory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    media: {
      type: String,
      required: true,
    },
    mediaPublicId: {
      type: String,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    viewers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IStory>("Story", storySchema);
