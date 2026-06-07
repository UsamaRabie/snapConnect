import SavedPost from "../models/savedPost.model";
import Post from "../models/post.model";
import { ApiError } from "../utils/apiError";

const POPULATE = { path: "post", populate: { path: "user", select: "username fullName avatar" } };

export const savePost = async (userId: string, postId: string) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const existing = await SavedPost.findOne({ user: userId, post: postId });
  if (existing) return { saved: true };

  await SavedPost.create({ user: userId, post: postId });
  return { saved: true };
};

export const unsavePost = async (userId: string, postId: string) => {
  const existing = await SavedPost.findOne({ user: userId, post: postId });
  if (!existing) throw new ApiError(404, "Post not saved");
  await existing.deleteOne();
  return { saved: false };
};

export const getSavedPosts = async (userId: string, page = 1, limit = 10) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const [saved, total] = await Promise.all([
    SavedPost.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate(POPULATE)
      .lean(),
    SavedPost.countDocuments({ user: userId }),
  ]);

  const posts = saved
    .map((s) => {
      const p = s.post as any;
      if (!p) return null;
      return {
        _id: p._id.toString(),
        user: p.user
          ? { id: p.user._id.toString(), username: p.user.username, fullName: p.user.fullName, avatar: p.user.avatar }
          : null,
        caption: p.caption,
        image: p.image,
        location: p.location,
        tags: p.tags || [],
        likesCount: p.likesCount ?? 0,
        commentsCount: p.commentsCount ?? 0,
        isLiked: false,
        isSaved: true,
        isArchived: p.isArchived ?? false,
        createdAt: p.createdAt?.toISOString?.() || p.createdAt,
        updatedAt: p.updatedAt?.toISOString?.() || p.updatedAt,
      };
    })
    .filter(Boolean);

  return {
    posts,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
  };
};

export const getSavedPostIds = async (userId: string, postIds: string[]): Promise<Set<string>> => {
  const saved = await SavedPost.find({ user: userId, post: { $in: postIds } })
    .select("post")
    .lean();
  return new Set(saved.map((s) => s.post.toString()));
};
