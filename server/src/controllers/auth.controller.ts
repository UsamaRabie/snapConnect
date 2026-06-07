import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/apiResponse";
import * as authService from "../services/auth.service";
import { config } from "../config/env";
import { AuthRequest } from "../middleware/auth";

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const { username, email, password, fullName } = req.body;

  const result = await authService.registerUser(
    username,
    email,
    password,
    fullName
  );

  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

  sendResponse(res, {
    statusCode: 201,
    message: "User registered successfully",
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

  sendResponse(res, {
    statusCode: 200,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    },
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const incomingToken =
    req.body.refreshToken || req.cookies?.refreshToken;

  if (!incomingToken) {
    return sendResponse(res, {
      statusCode: 400,
      message: "Refresh token is required",
    });
  }

  const tokens = await authService.refreshUserToken(incomingToken);

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  sendResponse(res, {
    statusCode: 200,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user) {
    await authService.logoutUser(req.user.id);
  }

  clearAuthCookies(res);

  sendResponse(res, {
    statusCode: 200,
    message: "Logged out successfully",
  });
});

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);

  sendResponse(res, {
    statusCode: 200,
    data: { user },
  });
});
