import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  text: string;
  parentComment?: mongoose.Types.ObjectId;
  ancestors: mongoose.Types.ObjectId[];
  depth: number;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
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
      index: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 500,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    ancestors: {
      type: [Schema.Types.ObjectId],
      ref: "Comment",
      default: [],
    },
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ ancestors: 1 });

export default mongoose.model<IComment>("Comment", commentSchema);
