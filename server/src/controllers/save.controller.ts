import { Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/apiResponse";
import * as saveService from "../services/save.service";
import { AuthRequest } from "../middleware/auth";

export const save = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await saveService.savePost(req.user!.id, req.params.id as string);
  sendResponse(res, { statusCode: 200, data: result });
});

export const unsave = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await saveService.unsavePost(req.user!.id, req.params.id as string);
  sendResponse(res, { statusCode: 200, data: result });
});

export const getSaved = catchAsync(async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await saveService.getSavedPosts(req.user!.id, page, limit);
  sendResponse(res, { statusCode: 200, data: { posts: result.posts }, pagination: result.pagination });
});
