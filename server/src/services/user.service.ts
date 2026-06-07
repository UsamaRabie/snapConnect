import User from "../models/user.model";
import Follow from "../models/follow.model";
import { ApiError } from "../utils/apiError";
import { paginateQuery } from "../utils/helpers";

const escapeRegex = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const USER_SEARCH_SELECT = "username fullName avatar bio followersCount";

export const getUserById = async (
  userId: string,
  currentUserId?: string
): Promise<any> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  let isFollowing = false;
  if (currentUserId && currentUserId !== userId) {
    const follow = await Follow.findOne({
      follower: currentUserId,
      following: userId,
    });
    isFollowing = !!follow;
  }

  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    bio: user.bio || "",
    avatar: user.avatar || "",
    coverImage: user.coverImage || "",
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
    createdAt: user.createdAt,
    isFollowing,
  };
};

export const getUserByUsername = async (
  username: string,
  currentUserId?: string
): Promise<any> => {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw new ApiError(404, "User not found");

  let isFollowing = false;
  if (currentUserId) {
    const follow = await Follow.findOne({
      follower: currentUserId,
      following: user._id,
    });
    isFollowing = !!follow;
  }

  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    bio: user.bio || "",
    avatar: user.avatar || "",
    coverImage: user.coverImage || "",
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
    createdAt: user.createdAt,
    isFollowing,
  };
};

export const searchUsers = async (
  query: string,
  page?: number,
  limit?: number,
  currentUserId?: string
): Promise<any> => {
  const { page: safePage, skip } = paginateQuery(page, limit);

  if (!query || query.trim().length === 0) {
    return { users: [], pagination: { page: safePage, limit: safePage, total: 0, totalPages: 0 } };
  }

  const escaped = escapeRegex(query.trim());
  const filter = {
    $or: [
      { username: { $regex: `^${escaped}`, $options: "i" } },
      { fullName: { $regex: escaped, $options: "i" } },
    ],
  };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(USER_SEARCH_SELECT)
      .sort({ followersCount: -1 })
      .skip(skip)
      .limit(safePage)
      .lean(),
    User.countDocuments(filter),
  ]);

  let followStatus: Map<string, boolean> = new Map();
  if (currentUserId && users.length > 0) {
    const userIds = users.map((u) => u._id);
    const follows = await Follow.find({
      follower: currentUserId,
      following: { $in: userIds },
    }).lean();
    follows.forEach((f) =>
      followStatus.set(f.following.toString(), true)
    );
  }

  const mapped = users.map((u) => ({
    id: u._id.toString(),
    username: u.username,
    fullName: u.fullName,
    avatar: u.avatar || "",
    bio: u.bio || "",
    followersCount: u.followersCount,
    isFollowing: followStatus.has(u._id.toString()),
  }));

  return {
    users: mapped,
    pagination: {
      page: safePage,
      limit: safePage,
      total,
      totalPages: Math.ceil(total / safePage),
    },
  };
};

export const searchSuggestions = async (
  query: string,
  currentUserId?: string,
  maxResults = 5
): Promise<any> => {
  if (!query || query.trim().length < 2) {
    return { users: [] };
  }

  const escaped = escapeRegex(query.trim());
  const filter = {
    $or: [
      { username: { $regex: `^${escaped}`, $options: "i" } },
      { fullName: { $regex: escaped, $options: "i" } },
    ],
  };

  const users = await User.find(filter)
    .select(USER_SEARCH_SELECT)
    .sort({ followersCount: -1 })
    .limit(maxResults)
    .lean();

  let followStatus: Map<string, boolean> = new Map();
  if (currentUserId && users.length > 0) {
    const userIds = users.map((u) => u._id);
    const follows = await Follow.find({
      follower: currentUserId,
      following: { $in: userIds },
    }).lean();
    follows.forEach((f) =>
      followStatus.set(f.following.toString(), true)
    );
  }

  return {
    users: users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      fullName: u.fullName,
      avatar: u.avatar || "",
      bio: u.bio || "",
      followersCount: u.followersCount,
      isFollowing: followStatus.has(u._id.toString()),
    })),
  };
};


