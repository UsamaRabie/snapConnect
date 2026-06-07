import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if ((err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyValue)[0];
    message = `Duplicate value for ${field}. This ${field} is already taken.`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please log in again.";
  }

  res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
