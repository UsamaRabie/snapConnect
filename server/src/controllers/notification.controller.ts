import { Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/apiResponse";
import * as notificationService from "../services/notification.service";
import { AuthRequest } from "../middleware/auth";

export const getNotifications = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const result = await notificationService.getUserNotifications(
      req.user!.id,
      Number(page),
      Number(limit)
    );

    sendResponse(res, {
      statusCode: 200,
      data: { notifications: result.notifications },
      pagination: result.pagination,
    });
  }
);

export const getUnreadCount = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);

    sendResponse(res, {
      statusCode: 200,
      data: { count },
    });
  }
);

export const markAsRead = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const notificationId = req.params.id as string;

    const result = await notificationService.markAsRead(
      notificationId,
      req.user!.id
    );

    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        message: "Notification not found",
      });
    }

    sendResponse(res, {
      statusCode: 200,
      message: "Notification marked as read",
      data: result,
    });
  }
);

export const markAllAsRead = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await notificationService.markAllAsRead(req.user!.id);

    sendResponse(res, {
      statusCode: 200,
      message: "All notifications marked as read",
      data: result,
    });
  }
);
