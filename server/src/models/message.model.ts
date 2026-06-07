import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text?: string;
  image?: string;
  isRead: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model<IMessage>("Message", messageSchema);
