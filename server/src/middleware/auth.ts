import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { config } from "../config/env";
import { ApiError } from "../utils/apiError";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(401, "Not authorized. No token provided.");
    }

    const decoded = jwt.verify(token, config.jwtAccessSecret) as {
      id: string;
    };

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "User belonging to this token no longer exists.");
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.headers.authorization?.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : req.cookies?.accessToken;

    if (!token) return next();

    const decoded = jwt.verify(token, config.jwtAccessSecret) as {
      id: string;
    };
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      };
    }
    next();
  } catch {
    next();
  }
};
