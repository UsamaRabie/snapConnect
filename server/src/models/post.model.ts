import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  caption?: string;
  image?: string;
  imagePublicId?: string;
  video?: string;
  videoPublicId?: string;
  location?: string;
  tags: string[];
  taggedUsers: mongoose.Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    caption: {
      type: String,
      maxlength: 2200,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
      default: "",
    },
    video: {
      type: String,
      default: "",
    },
    videoPublicId: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    taggedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

postSchema.index({ user: 1, isArchived: 1, createdAt: -1 });
postSchema.index({ isArchived: 1, likesCount: -1, createdAt: -1 });
postSchema.index({ tags: 1 });

export default mongoose.model<IPost>("Post", postSchema);
