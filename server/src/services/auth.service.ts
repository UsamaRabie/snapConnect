import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { config } from "../config/env";
import { ApiError } from "../utils/apiError";

interface TokenPayload {
  id: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn as any,
  });
};

const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
  });
};

const generateTokens = (payload: TokenPayload): Tokens => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

const sanitizeUser = (user: any) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  avatar: user.avatar,
  bio: user.bio,
  followersCount: user.followersCount,
  followingCount: user.followingCount,
  createdAt: user.createdAt,
});

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  fullName: string
) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? "email" : "username";
    throw new ApiError(409, `A user with this ${field} already exists`);
  }

  const user = await User.create({ username, email, password, fullName });

  const tokens = generateTokens({ id: user._id.toString() });

  return {
    user: sanitizeUser(user),
    tokens,
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const tokens = generateTokens({ id: user._id.toString() });

  return {
    user: sanitizeUser(user),
    tokens,
  };
};

export const refreshUserToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      config.jwtRefreshSecret
    ) as TokenPayload;

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const tokens = generateTokens({ id: user._id.toString() });

    return tokens;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid or expired refresh token");
  }
};

export const logoutUser = async (_userId: string) => {

};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
};
