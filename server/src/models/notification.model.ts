import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  type: "follow" | "like" | "comment" | "reply" | "tag" | "message";
  sender: mongoose.Types.ObjectId;
  post?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["follow", "like", "comment", "reply", "tag", "message"],
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model<INotification>("Notification", notificationSchema);
