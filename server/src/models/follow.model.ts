import mongoose, { Document, Schema } from "mongoose";

export interface IFollow extends Document {
  _id: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  createdAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

export default mongoose.model<IFollow>("Follow", followSchema);
