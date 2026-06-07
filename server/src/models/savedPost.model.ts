import mongoose, { Document, Schema } from "mongoose";

export interface ISavedPost extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savedPostSchema = new Schema<ISavedPost>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

savedPostSchema.index({ user: 1, post: 1 }, { unique: true });
savedPostSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<ISavedPost>("SavedPost", savedPostSchema);
