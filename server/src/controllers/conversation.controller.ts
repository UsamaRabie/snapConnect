import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/apiResponse";
import * as conversationService from "../services/conversation.service";

export const getConversations = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const conversations = await conversationService.getUserConversations(
      req.user!.id
    );
    sendResponse(res, {
      statusCode: 200,
      data: { conversations },
    });
  }
);

export const getOrCreate = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId as string;
    if (userId === req.user!.id) {
      return sendResponse(res, { statusCode: 400, message: "Cannot chat with yourself" });
    }
    const conversation = await conversationService.getOrCreateConversation(
      req.user!.id,
      userId
    );
    sendResponse(res, {
      statusCode: 200,
      data: { conversation },
    });
  }
);

export const getMessages = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;
    const conversationId = req.params.id as string;
    const result = await conversationService.getConversationMessages(
      conversationId,
      req.user!.id,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );
    sendResponse(res, {
      statusCode: 200,
      data: { messages: result.messages },
      pagination: result.pagination,
    });
  }
);

export const sendMessage = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { text } = req.body;
    const conversationId = req.params.id as string;
    const message = await conversationService.sendMessage(
      conversationId,
      req.user!.id,
      text
    );
    sendResponse(res, {
      statusCode: 201,
      data: { message },
    });
  }
);
