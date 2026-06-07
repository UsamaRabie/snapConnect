import { Response } from "express";
import { unlink } from "fs/promises";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/apiResponse";
import * as postService from "../services/post.service";
import { AuthRequest } from "../middleware/auth";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary";
import { validateFileMagicBytes } from "../middleware/upload";

export const create = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { caption, location, tags, taggedUsers } = req.body;

    let image: string | undefined;
    let imagePublicId: string | undefined;

    if (req.file) {
      await validateFileMagicBytes(req.file.path);
      const result = await uploadToCloudinary(req.file.path, "posts");
      image = result.url;
      imagePublicId = result.publicId;
      await unlink(req.file.path).catch(() => {});
    }

    const post = await postService.createPost(req.user!.id, {
      caption,
      image,
      imagePublicId,
      location,
      tags,
      taggedUsers,
    });

    sendResponse(res, {
      statusCode: 201,
      message: "Post created",
      data: { post },
    });
  }
);

export const getFeed = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await postService.getFeedPosts(
      req.user!.id,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  }
);

export const getUserPosts = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await postService.getUserPosts(
      userId,
      req.user!.id,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  }
);

export const getById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    const post = await postService.getPostById(id, req.user!.id);

    sendResponse(res, {
      statusCode: 200,
      data: { post },
    });
  }
);

export const like = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    const result = await postService.likePost(req.user!.id, id);

    sendResponse(res, {
      statusCode: 200,
      data: result,
    });
  }
);

export const unlike = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    const result = await postService.unlikePost(req.user!.id, id);

    sendResponse(res, {
      statusCode: 200,
      data: result,
    });
  }
);

export const remove = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    const post = await postService.getPostById(id, req.user!.id);
    if (post.imagePublicId) {
      await deleteFromCloudinary(post.imagePublicId).catch(() => {});
    }

    const result = await postService.deletePost(id, req.user!.id);

    sendResponse(res, {
      statusCode: 200,
      data: result,
    });
  }
);

export const update = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { caption, location, tags } = req.body;

    let image: string | undefined;
    let imagePublicId: string | undefined;

    if (req.file) {
      await validateFileMagicBytes(req.file.path);
      const existing = await postService.getPostById(id, req.user!.id);
      if (existing.imagePublicId) {
        await deleteFromCloudinary(existing.imagePublicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.path, "posts");
      image = result.url;
      imagePublicId = result.publicId;
      await unlink(req.file.path).catch(() => {});
    }

    const post = await postService.updatePost(id, req.user!.id, {
      caption,
      location,
      tags,
      image,
      imagePublicId,
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Post updated",
      data: { post },
    });
  }
);

export const getLikes = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await postService.getPostLikes(
      id,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { users: result.users },
      pagination: result.pagination,
    });
  }
);

export const explore = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await postService.getExplorePosts(
      req.user!.id,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  }
);

export const getTagged = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId as string;
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await postService.getTaggedPosts(
      userId,
      req.user!.id,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  }
);
