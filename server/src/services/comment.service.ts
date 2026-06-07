import mongoose from "mongoose";
import Post from "../models/post.model";
import Comment from "../models/comment.model";
import { ApiError } from "../utils/apiError";
import { paginateQuery } from "../utils/helpers";
import { emitCommentCreated, emitCommentUpdated, emitCommentDeleted } from "../socket";
import { createNotification } from "./notification.service";

const COMMENT_POPULATE = { path: "user", select: "username fullName avatar" };

const sanitize = (c: any) => ({
  _id: c._id.toString(),
  user: c.user?._id
    ? { id: c.user._id.toString(), username: c.user.username, fullName: c.user.fullName, avatar: c.user.avatar }
    : { id: c.user.toString(), username: "", fullName: "", avatar: "" },
  post: c.post?.toString?.() || c.post,
  text: c.text,
  parentComment: c.parentComment ? c.parentComment.toString() : null,
  ancestors: (c.ancestors || []).map((a: any) => a.toString()),
  depth: c.depth ?? 0,
  createdAt: c.createdAt?.toISOString?.() || c.createdAt,
  updatedAt: c.updatedAt?.toISOString?.() || c.updatedAt,
});

export const createComment = async (
  userId: string,
  postId: string,
  text: string,
  parentCommentId?: string
) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  let ancestors: string[] = [];
  let depth = 0;

  if (parentCommentId) {
    const parent = await Comment.findById(parentCommentId);
    if (!parent) throw new ApiError(404, "Parent comment not found");
    if (parent.post.toString() !== postId) {
      throw new ApiError(400, "Parent comment does not belong to this post");
    }
    ancestors = [...parent.ancestors.map((a: any) => a.toString()), parentCommentId];
    depth = parent.depth + 1;
    if (depth > 100) throw new ApiError(400, "Maximum nesting depth reached");
  }

  const [comment] = await Promise.all([
    Comment.create({
      user: userId,
      post: postId,
      text,
      parentComment: parentCommentId || null,
      ancestors: ancestors.map((id) => new mongoose.Types.ObjectId(id)),
      depth,
    }),
    Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }),
  ]);

  await Comment.populate(comment, COMMENT_POPULATE);

  const plain = sanitize(comment.toObject());
  emitCommentCreated(postId, plain);

  const postUserId = post.user.toString();
  if (postUserId !== userId) {
    createNotification(postUserId, "comment", userId, postId, comment._id.toString());
  }

  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId).select("user");
    if (parentComment && parentComment.user.toString() !== userId) {
      createNotification(parentComment.user.toString(), "reply", userId, postId, comment._id.toString());
    }
  }

  return plain;
};

export const getPostComments = async (
  postId: string,
  page?: number,
  limit?: number
): Promise<any> => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const { page: safePage, limit: safeLimit, skip } = paginateQuery(page, limit);

  const [topLevel, total] = await Promise.all([
    Comment.find({ post: postId, parentComment: null })
      .populate(COMMENT_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Comment.countDocuments({ post: postId, parentComment: null }),
  ]);

  const topIds = topLevel.map((c) => c._id);
  const descendants = topIds.length > 0
    ? await Comment.find({ ancestors: { $in: topIds } })
        .populate(COMMENT_POPULATE)
        .sort({ ancestors: 1, createdAt: 1 })
        .lean()
    : [];

  const all = [...topLevel, ...descendants];
  const flat = all.map((c) => sanitize(c));
  const mapped = flat.map((c) => ({
    ...c,
    children: [] as any[],
  }));
  const map = new Map(mapped.map((c) => [c._id, c]));
  const roots: any[] = [];

  mapped.forEach((c) => {
    if (c.parentComment && map.has(c.parentComment)) {
      map.get(c.parentComment)!.children.push(c);
    } else if (!c.parentComment) {
      roots.push(c);
    }
  });

  const sortChildren = (nodes: any[]) => {
    nodes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);

  return {
    comments: roots,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const getCommentThread = async (
  commentId: string,
  page?: number,
  limit?: number
): Promise<any> => {
  const comment = await Comment.findById(commentId).populate(COMMENT_POPULATE);
  if (!comment) throw new ApiError(404, "Comment not found");

  const { page: safePage, limit: safeLimit, skip } = paginateQuery(page, limit);

  const [descendants, total] = await Promise.all([
    Comment.find({ ancestors: commentId })
      .populate(COMMENT_POPULATE)
      .sort({ ancestors: 1, createdAt: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Comment.countDocuments({ ancestors: commentId }),
  ]);

  const all = [comment.toObject(), ...descendants];
  const flat = all.map((c) => sanitize(c));
  const mapped = flat.map((c) => ({ ...c, children: [] as any[] }));
  const map = new Map(mapped.map((c) => [c._id, c]));
  const roots: any[] = [];

  mapped.forEach((c) => {
    if (c.parentComment && map.has(c.parentComment)) {
      map.get(c.parentComment)!.children.push(c);
    } else {
      roots.push(c);
    }
  });

  return { thread: roots, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
};

export const editComment = async (
  commentId: string,
  userId: string,
  text: string
) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.user.toString() !== userId) {
    throw new ApiError(403, "Not authorized to edit this comment");
  }

  comment.text = text;
  await comment.save();

  await Comment.populate(comment, COMMENT_POPULATE);

  const postId = comment.post.toString();
  emitCommentUpdated(postId, commentId, text, comment.updatedAt.toISOString());

  return sanitize(comment.toObject());
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.user.toString() !== userId) {
    throw new ApiError(403, "Not authorized to delete this comment");
  }

  const postId = comment.post.toString();

  const descendants = await Comment.find({ ancestors: commentId }).select("_id").lean();
  const descendantIds = descendants.map((d) => d._id);
  const allIds = [comment._id, ...descendantIds];

  await Promise.all([
    Comment.deleteMany({ _id: { $in: allIds } }),
    Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -allIds.length } }),
  ]);

  emitCommentDeleted(postId, commentId, allIds.length);

  return { message: "Comment deleted", deletedCount: allIds.length };
};
