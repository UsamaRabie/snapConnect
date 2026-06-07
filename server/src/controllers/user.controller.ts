import { Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/apiResponse";
import * as userService from "../services/user.service";
import * as profileService from "../services/profile.service";
import { AuthRequest } from "../middleware/auth";

export const getProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const user = await userService.getUserById(id, req.user?.id);

    sendResponse(res, {
      statusCode: 200,
      data: { user },
    });
  }
);

export const search = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const q = req.query.q as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await userService.searchUsers(
      q,
      Number(page),
      Number(limit),
      req.user!.id
    );

    sendResponse(res, {
      statusCode: 200,
      data: { users: result.users },
      pagination: result.pagination,
    });
  }
);

export const getSuggestions = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const q = req.query.q as string;

    const result = await userService.searchSuggestions(
      q,
      req.user!.id
    );

    sendResponse(res, {
      statusCode: 200,
      data: { users: result.users },
    });
  }
);

export const follow = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await profileService.followUser(req.user!.id, id);

    sendResponse(res, {
      statusCode: 200,
      data: result,
    });
  }
);

export const unfollow = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await profileService.unfollowUser(req.user!.id, id);

    sendResponse(res, {
      statusCode: 200,
      data: result,
    });
  }
);

export const getFollowers = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await profileService.getFollowers(
      id,
      Number(page) || 1,
      Number(limit) || 20
    );

    sendResponse(res, {
      statusCode: 200,
      data: { users: result.users },
      pagination: result.pagination,
    });
  }
);

export const getFollowing = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await profileService.getFollowing(
      id,
      Number(page) || 1,
      Number(limit) || 20
    );

    sendResponse(res, {
      statusCode: 200,
      data: { users: result.users },
      pagination: result.pagination,
    });
  }
);

export const getSuggested = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await profileService.getSuggestedUsers(
      req.user!.id,
      Number(page) || 1,
      Number(limit) || 10
    );

    sendResponse(res, {
      statusCode: 200,
      data: { users: result.users },
      pagination: result.pagination,
    });
  }
);
