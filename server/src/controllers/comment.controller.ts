import { Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/apiResponse";
import * as commentService from "../services/comment.service";
import { AuthRequest } from "../middleware/auth";

export const create = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const postId = req.params.id as string;
    const { text, parentComment } = req.body;

    const comment = await commentService.createComment(
      req.user!.id,
      postId,
      text,
      parentComment
    );

    sendResponse(res, {
      statusCode: 201,
      message: "Comment created",
      data: { comment },
    });
  }
);

export const getComments = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const postId = req.params.id as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await commentService.getPostComments(
      postId,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { comments: result.comments },
      pagination: result.pagination,
    });
  }
);

export const getReplies = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const commentId = req.params.commentId as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await commentService.getCommentThread(
      commentId,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { thread: result.thread },
      pagination: result.pagination,
    });
  }
);

export const getThread = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const commentId = req.params.commentId as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await commentService.getCommentThread(
      commentId,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { thread: result.thread },
      pagination: result.pagination,
    });
  }
);

export const update = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const commentId = req.params.commentId as string;
    const { text } = req.body;

    const comment = await commentService.editComment(commentId, req.user!.id, text);

    sendResponse(res, {
      statusCode: 200,
      message: "Comment updated",
      data: { comment },
    });
  }
);

export const remove = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const commentId = req.params.commentId as string;

    const result = await commentService.deleteComment(commentId, req.user!.id);

    sendResponse(res, {
      statusCode: 200,
      data: result,
    });
  }
);
