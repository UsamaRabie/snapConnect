import { Response } from "express";

interface ApiResponseOptions {
  statusCode: number;
  message?: string;
  data?: unknown;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendResponse = (res: Response, options: ApiResponseOptions) => {
  const { statusCode, message, data, pagination } = options;

  const response: Record<string, unknown> = {
    status: statusCode < 400 ? "success" : "error",
  };

  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  if (pagination) response.pagination = pagination;

  res.status(statusCode).json(response);
};
