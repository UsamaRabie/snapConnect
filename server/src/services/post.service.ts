import Post from "../models/post.model";
import Like from "../models/like.model";
import Comment from "../models/comment.model";
import Follow from "../models/follow.model";
import User from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { paginateQuery } from "../utils/helpers";
import { emitPostLike } from "../socket";
import { createNotification } from "./notification.service";
import { getSavedPostIds } from "./save.service";

export const createPost = async (
  userId: string,
  data: {
    caption?: string;
    image?: string;
    imagePublicId?: string;
    video?: string;
    videoPublicId?: string;
    location?: string;
    tags?: string[];
    taggedUsers?: string[];
  }
) => {
  const post = await Post.create({
    user: userId,
    ...data,
    taggedUsers: data.taggedUsers || [],
  });

  await Promise.all([
    Post.populate(post, { path: "user", select: "username fullName avatar" }),
    User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } }),
  ]);

  if (data.taggedUsers && data.taggedUsers.length > 0) {
    for (const tagUserId of data.taggedUsers) {
      if (tagUserId !== userId) {
        createNotification(tagUserId, "tag", userId, post._id.toString());
      }
    }
  }

  return post;
};

export const getFeedPosts = async (
  userId: string,
  page?: number,
  limit?: number
): Promise<any> => {
  const { page: safePage, limit: safeLimit, skip } = paginateQuery(page, limit);

  const followedUsers = await Follow.find({ follower: userId }).select(
    "following"
  );
  const followingIds = followedUsers.map((f) => f.following);

  followingIds.push(userId as any);

  const [posts, total] = await Promise.all([
    Post.find({ user: { $in: followingIds }, isArchived: false })
      .populate("user", "username fullName avatar")
      .populate("taggedUsers", "username fullName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Post.countDocuments({ user: { $in: followingIds }, isArchived: false }),
  ]);

  const postIds = posts.map((p) => p._id);

  const [likes, comments, savedIds] = await Promise.all([
    Like.find({ user: userId, post: { $in: postIds } }).lean(),
    Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]),
    getSavedPostIds(userId, postIds.map((p) => p.toString())),
  ]);

  const likedPostIds = new Set(likes.map((l) => l.post.toString()));
  const commentCountMap = new Map(
    comments.map((c) => [c._id.toString(), c.count])
  );

  const postsWithMeta = posts.map((post) => {
    const pu = post.user as any;
    const tu = post.taggedUsers as any[] | undefined;
    return {
      ...post,
      user: {
        id: (pu._id || pu.id).toString(),
        username: pu.username,
        fullName: pu.fullName,
        avatar: pu.avatar,
      },
      taggedUsers: (tu || []).map((t: any) => ({
        id: (t._id || t).toString(),
        username: t.username || "",
        fullName: t.fullName || "",
        avatar: t.avatar || "",
      })),
      isLiked: likedPostIds.has(post._id.toString()),
      isSaved: savedIds.has(post._id.toString()),
      commentCount: commentCountMap.get(post._id.toString()) || post.commentsCount,
    };
  });

  return {
    posts: postsWithMeta,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const getUserPosts = async (
  userId: string,
  currentUserId: string,
  page?: number,
  limit?: number
): Promise<any> => {
  const { page: safePage, limit: safeLimit, skip } = paginateQuery(page, limit);

  const [posts, total] = await Promise.all([
    Post.find({ user: userId, isArchived: false })
      .populate("user", "username fullName avatar")
      .populate("taggedUsers", "username fullName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Post.countDocuments({ user: userId, isArchived: false }),
  ]);

  const postIds = posts.map((p) => p._id);
  const [likes, savedIds] = await Promise.all([
    Like.find({ user: currentUserId, post: { $in: postIds } }).lean(),
    getSavedPostIds(currentUserId, postIds.map((p) => p.toString())),
  ]);
  const likedPostIds = new Set(likes.map((l) => l.post.toString()));

  const postsWithMeta = posts.map((post) => {
    const pu = post.user as any;
    const tu = post.taggedUsers as any[] | undefined;
    return {
      ...post,
      user: {
        id: (pu._id || pu.id).toString(),
        username: pu.username,
        fullName: pu.fullName,
        avatar: pu.avatar,
      },
      taggedUsers: (tu || []).map((t: any) => ({
        id: (t._id || t).toString(),
        username: t.username || "",
        fullName: t.fullName || "",
        avatar: t.avatar || "",
      })),
      isLiked: likedPostIds.has(post._id.toString()),
      isSaved: savedIds.has(post._id.toString()),
    };
  });

  return {
    posts: postsWithMeta,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const getPostById = async (postId: string, userId: string): Promise<any> => {
  const post = await Post.findById(postId)
    .populate("user", "username fullName avatar")
    .populate("taggedUsers", "username fullName avatar")
    .lean();

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const [isLiked, likesCount, savedIds] = await Promise.all([
    Like.exists({ user: userId, post: postId }),
    Like.countDocuments({ post: postId }),
    getSavedPostIds(userId, [postId]),
  ]);

  const user = post.user as any;
  const tu = post.taggedUsers as any[] | undefined;
  return {
    ...post,
    user: {
      id: (user._id || user.id).toString(),
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
    },
    taggedUsers: (tu || []).map((t: any) => ({
      id: (t._id || t).toString(),
      username: t.username || "",
      fullName: t.fullName || "",
      avatar: t.avatar || "",
    })),
    isLiked: !!isLiked,
    isSaved: savedIds.has(postId),
    likesCount,
  };
};

export const likePost = async (userId: string, postId: string) => {
  const post = await Post.findById(postId).select("_id user");
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  try {
    await Promise.all([
      Like.create({ user: userId, post: postId }),
      Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }),
    ]);
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new ApiError(409, "Already liked this post");
    }
    throw err;
  }

  const likesCount = await Post.findById(postId).select("likesCount").lean();
  emitPostLike(postId, userId, likesCount?.likesCount || 0, true);

  const postUserId = post.user.toString();
  createNotification(postUserId, "like", userId, postId);

  return { message: "Post liked" };
};

export const unlikePost = async (userId: string, postId: string) => {
  const like = await Like.findOneAndDelete({ user: userId, post: postId });
  if (!like) {
    throw new ApiError(404, "Like not found");
  }

  const updated = await Post.findByIdAndUpdate(
    postId,
    { $inc: { likesCount: -1 } },
    { new: true }
  ).select("likesCount").lean();

  emitPostLike(postId, userId, updated?.likesCount || 0, false);

  return { message: "Post unliked" };
};

export const updatePost = async (
  postId: string,
  userId: string,
  data: {
    caption?: string;
    location?: string;
    tags?: string[];
    image?: string;
    imagePublicId?: string;
  }
) => {
  const post = await Post.findOne({ _id: postId, user: userId });
  if (!post) throw new ApiError(404, "Post not found or not authorized");

  if (data.caption !== undefined) post.caption = data.caption;
  if (data.location !== undefined) post.location = data.location;
  if (data.tags !== undefined) post.tags = data.tags;
  if (data.image) post.image = data.image;
  if (data.imagePublicId) post.imagePublicId = data.imagePublicId;

  await post.save();

  await Post.populate(post, {
    path: "user",
    select: "username fullName avatar",
  });

  return post;
};

export const getPostLikes = async (
  postId: string,
  page?: number,
  limit?: number
) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const { page: safePage, limit: safeLimit, skip } = paginateQuery(page, limit);

  const [likes, total] = await Promise.all([
    Like.find({ post: postId })
      .populate("user", "username fullName avatar bio followersCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Like.countDocuments({ post: postId }),
  ]);

  return {
    users: likes.map((l) => {
      const u = l.user as any;
      return {
        id: (u._id || u.id).toString(),
        username: u.username,
        fullName: u.fullName,
        avatar: u.avatar,
        bio: u.bio,
        followersCount: u.followersCount,
      };
    }),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const deletePost = async (postId: string, userId: string) => {
  const post = await Post.findOne({ _id: postId, user: userId });

  if (!post) {
    throw new ApiError(404, "Post not found or not authorized");
  }

  await Promise.all([
    Post.findByIdAndDelete(postId),
    Like.deleteMany({ post: postId }),
    Comment.deleteMany({ post: postId }),
    User.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } }),
  ]);

  return { message: "Post deleted" };
};

export const getExplorePosts = async (
  userId: string,
  page?: number,
  limit?: number
): Promise<any> => {
  const { page: safePage, limit: safeLimit, skip } = paginateQuery(page, limit);

  const [posts, total] = await Promise.all([
    Post.find({ isArchived: false })
      .populate("user", "username fullName avatar")
      .populate("taggedUsers", "username fullName avatar")
      .sort({ likesCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Post.countDocuments({ isArchived: false }),
  ]);

  const postIds = posts.map((p) => p._id);
  const [likes, savedIds] = await Promise.all([
    Like.find({ user: userId, post: { $in: postIds } }).lean(),
    getSavedPostIds(userId, postIds.map((p) => p.toString())),
  ]);
  const likedPostIds = new Set(likes.map((l) => l.post.toString()));

  return {
    posts: posts.map((post) => {
      const pu = post.user as any;
      const tu = post.taggedUsers as any[] | undefined;
      return {
        ...post,
        user: {
          id: (pu._id || pu.id).toString(),
          username: pu.username,
          fullName: pu.fullName,
          avatar: pu.avatar,
        },
        taggedUsers: (tu || []).map((t: any) => ({
          id: (t._id || t).toString(),
          username: t.username || "",
          fullName: t.fullName || "",
          avatar: t.avatar || "",
        })),
        isLiked: likedPostIds.has(post._id.toString()),
        isSaved: savedIds.has(post._id.toString()),
      };
    }),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const getTaggedPosts = async (
  userId: string,
  currentUserId: string,
  page?: number,
  limit?: number
): Promise<any> => {
  const { page: safePage, limit: safeLimit, skip } = paginateQuery(page, limit);

  const [posts, total] = await Promise.all([
    Post.find({ taggedUsers: userId, isArchived: false })
      .populate("user", "username fullName avatar")
      .populate("taggedUsers", "username fullName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Post.countDocuments({ taggedUsers: userId, isArchived: false }),
  ]);

  const postIds = posts.map((p) => p._id);
  const [likes, savedIds] = await Promise.all([
    Like.find({ user: currentUserId, post: { $in: postIds } }).lean(),
    getSavedPostIds(currentUserId, postIds.map((p) => p.toString())),
  ]);
  const likedPostIds = new Set(likes.map((l) => l.post.toString()));

  return {
    posts: posts.map((post) => {
      const pu = post.user as any;
      const tu = post.taggedUsers as any[] | undefined;
      return {
        ...post,
        user: {
          id: (pu._id || pu.id).toString(),
          username: pu.username,
          fullName: pu.fullName,
          avatar: pu.avatar,
        },
        taggedUsers: (tu || []).map((t: any) => ({
          id: (t._id || t).toString(),
          username: t.username || "",
          fullName: t.fullName || "",
          avatar: t.avatar || "",
        })),
        isLiked: likedPostIds.has(post._id.toString()),
        isSaved: savedIds.has(post._id.toString()),
      };
    }),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};
