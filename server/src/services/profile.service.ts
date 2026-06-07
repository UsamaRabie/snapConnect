import User, { IUser } from "../models/user.model";
import Follow from "../models/follow.model";
import Post from "../models/post.model";
import { ApiError } from "../utils/apiError";
import { createNotification } from "./notification.service";

const sanitizeProfile = (user: any) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  bio: user.bio || "",
  avatar: user.avatar || "",
  avatarPublicId: user.avatarPublicId || "",
  coverImage: user.coverImage || "",
  coverImagePublicId: user.coverImagePublicId || "",
  followersCount: user.followersCount,
  followingCount: user.followingCount,
  postsCount: user.postsCount,
  createdAt: user.createdAt,
});

export const getProfile = async (userId: string, currentUserId?: string) => {
  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "User not found");

  const [isFollowing, followers, following] = await Promise.all([
    currentUserId && currentUserId !== userId
      ? Follow.findOne({ follower: currentUserId, following: userId }).then(
          (f) => !!f
        )
      : Promise.resolve(false),
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId }),
  ]);

  return {
    ...sanitizeProfile(user),
    isFollowing,
    followersCount: followers,
    followingCount: following,
  };
};

export const getProfileByUsername = async (
  username: string,
  currentUserId?: string
) => {
  const user = await User.findOne({ username: username.toLowerCase() });

  if (!user) throw new ApiError(404, "User not found");

  const isFollowing = currentUserId
    ? await Follow.findOne({
        follower: currentUserId,
        following: user._id,
      }).then((f) => !!f)
    : false;

  return { ...sanitizeProfile(user), isFollowing };
};

export const updateProfile = async (
  userId: string,
  updates: {
    fullName?: string;
    bio?: string;
    username?: string;
  }
) => {
  if (updates.username) {
    const existing = await User.findOne({
      username: updates.username.toLowerCase(),
      _id: { $ne: userId },
    });
    if (existing) {
      throw new ApiError(409, "Username is already taken");
    }
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) throw new ApiError(404, "User not found");

  return sanitizeProfile(user);
};

export const updateAvatar = async (userId: string, avatarPath: string, publicId?: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { avatar: avatarPath, avatarPublicId: publicId || "" },
    { new: true }
  ).select("-password");

  if (!user) throw new ApiError(404, "User not found");

  return sanitizeProfile(user);
};

export const updateCoverImage = async (userId: string, coverPath: string, publicId?: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { coverImage: coverPath, coverImagePublicId: publicId || "" },
    { new: true }
  ).select("-password");

  if (!user) throw new ApiError(404, "User not found");

  return sanitizeProfile(user);
};

export const checkUsername = async (username: string, excludeId?: string) => {
  const query: any = { username: username.toLowerCase() };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await User.findOne(query);
  return {
    available: !existing,
    message: existing ? "Username is already taken" : "Username is available",
  };
};

export const getUserPosts = async (userId: string, page = 1, limit = 12) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const skip = (safePage - 1) * safeLimit;

  const [posts, total] = await Promise.all([
    Post.find({ user: userId, isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Post.countDocuments({ user: userId, isArchived: false }),
  ]);

  return {
    posts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const getFollowers = async (userId: string, page = 1, limit = 20) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const [follows, total] = await Promise.all([
    Follow.find({ following: userId })
      .populate("follower", "username fullName avatar bio followersCount")
      .skip(skip)
      .limit(safeLimit)
      .sort({ createdAt: -1 }),
    Follow.countDocuments({ following: userId }),
  ]);

  return {
    users: follows.map((f) => {
      const u = f.follower as any;
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

export const getFollowing = async (userId: string, page = 1, limit = 20) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const [follows, total] = await Promise.all([
    Follow.find({ follower: userId })
      .populate("following", "username fullName avatar bio followersCount")
      .skip(skip)
      .limit(safeLimit)
      .sort({ createdAt: -1 }),
    Follow.countDocuments({ follower: userId }),
  ]);

  return {
    users: follows.map((f) => {
      const u = f.following as any;
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

export const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const targetUser = await User.findById(followingId);
  if (!targetUser) throw new ApiError(404, "User not found");

  const existing = await Follow.findOne({
    follower: followerId,
    following: followingId,
  });
  if (existing) throw new ApiError(409, "Already following this user");

  await Follow.create({ follower: followerId, following: followingId });

  await Promise.all([
    User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }),
    User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } }),
    createNotification(followingId, "follow", followerId),
  ]);

  return { message: "Followed successfully" };
};

export const getSuggestedUsers = async (
  userId: string,
  page = 1,
  limit = 10
) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const followed = await Follow.find({ follower: userId }).select("following");
  const followedIds = followed.map((f) => f.following);
  followedIds.push(userId as any);

  const [users, total] = await Promise.all([
    User.find({ _id: { $nin: followedIds } })
      .select("username fullName avatar bio followersCount")
      .sort({ followersCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    User.countDocuments({ _id: { $nin: followedIds } }),
  ]);

  return {
    users: users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      fullName: u.fullName,
      avatar: u.avatar,
      bio: u.bio,
      followersCount: u.followersCount,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const follow = await Follow.findOneAndDelete({
    follower: followerId,
    following: followingId,
  });

  if (!follow) throw new ApiError(404, "Follow relationship not found");

  await Promise.all([
    User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }),
    User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } }),
  ]);

  return { message: "Unfollowed successfully" };
};
