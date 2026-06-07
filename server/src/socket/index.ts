import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

let io: Server | null = null;

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key) cookies[key.trim()] = rest.join("=");
  }
  return cookies;
};

export const initSocket = (httpServer: HttpServer) => {
  const corsOrigins = config.corsOrigin.split(",").map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth.token;

      if (!token) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies.accessToken;
      }

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, config.jwtAccessSecret) as { id: string };
      (socket as any).userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;

    socket.join(`user:${userId}`);

    socket.on("join:post", (postId: string) => {
      socket.join(`post:${postId}`);
    });

    socket.on("leave:post", (postId: string) => {
      socket.leave(`post:${postId}`);
    });

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("message:typing", (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("message:typing", data);
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const emitPostLike = (postId: string, userId: string, likesCount: number, isLiked: boolean) => {
  if (!io) return;
  io.to(`post:${postId}`).emit("post:like", { postId, userId, likesCount, isLiked });
};

export const emitCommentCreated = (postId: string, comment: any) => {
  if (!io) return;
  io.to(`post:${postId}`).emit("comment:created", { postId, comment });
};

export const emitCommentUpdated = (postId: string, commentId: string, text: string, updatedAt: string) => {
  if (!io) return;
  io.to(`post:${postId}`).emit("comment:updated", { postId, commentId, text, updatedAt });
};

export const emitCommentDeleted = (postId: string, commentId: string, deletedCount?: number) => {
  if (!io) return;
  io.to(`post:${postId}`).emit("comment:deleted", { postId, commentId, deletedCount });
};

export const emitNotification = (recipientId: string, notification: any) => {
  if (!io) return;
  io.to(`user:${recipientId}`).emit("notification:new", notification);
};

export const emitNewMessage = (conversationId: string, message: any, participants: string[]) => {
  if (!io) return;
  const srv = io;
  srv.to(`conversation:${conversationId}`).emit("message:new", { conversationId, message });
  participants.forEach((pid) => {
    srv.to(`user:${pid}`).emit("message:new", { conversationId, message });
  });
};
