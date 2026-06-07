import { Response } from "express";
import { unlink } from "fs/promises";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/apiResponse";
import * as profileService from "../services/profile.service";
import { AuthRequest } from "../middleware/auth";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary";
import { validateFileMagicBytes } from "../middleware/upload";

export const getProfileByUsername = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const username = req.params.username as string;
    const user = await profileService.getProfileByUsername(
      username,
      req.user?.id
    );

    sendResponse(res, { statusCode: 200, data: { user } });
  }
);

export const updateProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { fullName, bio, username } = req.body;

    const user = await profileService.updateProfile(req.user!.id, {
      fullName,
      bio,
      username,
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Profile updated",
      data: { user },
    });
  }
);

export const uploadAvatar = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendResponse(res, {
        statusCode: 400,
        message: "No file provided",
      });
    }

    await validateFileMagicBytes(req.file.path);

    const currentUser = await profileService.getProfile(req.user!.id);
    if (currentUser.avatarPublicId) {
      await deleteFromCloudinary(currentUser.avatarPublicId).catch(() => {});
    }

    const result = await uploadToCloudinary(req.file.path, "avatars");
    await unlink(req.file.path).catch(() => {});
    const user = await profileService.updateAvatar(req.user!.id, result.url, result.publicId);

    sendResponse(res, {
      statusCode: 200,
      message: "Avatar updated",
      data: { user },
    });
  }
);

export const uploadCoverImage = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendResponse(res, {
        statusCode: 400,
        message: "No file provided",
      });
    }

    await validateFileMagicBytes(req.file.path);

    const currentUser = await profileService.getProfile(req.user!.id);
    if (currentUser.coverImagePublicId) {
      await deleteFromCloudinary(currentUser.coverImagePublicId).catch(() => {});
    }

    const result = await uploadToCloudinary(req.file.path, "covers");
    await unlink(req.file.path).catch(() => {});
    const user = await profileService.updateCoverImage(
      req.user!.id,
      result.url,
      result.publicId
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Cover image updated",
      data: { user },
    });
  }
);

export const checkUsername = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const username = req.query.username as string;

    if (!username) {
      return sendResponse(res, {
        statusCode: 400,
        message: "Username is required",
      });
    }

    const result = await profileService.checkUsername(
      username,
      req.user?.id
    );

    sendResponse(res, { statusCode: 200, data: result });
  }
);

export const getUserPosts = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;

    const result = await profileService.getUserPosts(userId, page, limit);

    sendResponse(res, {
      statusCode: 200,
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  }
);
