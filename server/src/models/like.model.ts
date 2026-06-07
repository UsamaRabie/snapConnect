import mongoose, { Document, Schema } from "mongoose";

export interface ILike extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
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

likeSchema.index({ user: 1, post: 1 }, { unique: true });
likeSchema.index({ post: 1 });

export default mongoose.model<ILike>("Like", likeSchema);
