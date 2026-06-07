import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./axios";

const TOKEN_KEY = "snapconnect_access_token";

const getBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  return apiUrl.replace(/\/api\/v1\/?$/, "");
};

const resolveToken = (): string | null => {
  const memory = getAccessToken();
  if (memory) return memory;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = resolveToken();
  if (!token) return null;

  socket = io(getBaseUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinPostRoom = (postId: string) => {
  socket?.emit("join:post", postId);
};

export const leavePostRoom = (postId: string) => {
  socket?.emit("leave:post", postId);
};

export const joinConversationRoom = (conversationId: string) => {
  socket?.emit("join:conversation", conversationId);
};

export const leaveConversationRoom = (conversationId: string) => {
  socket?.emit("leave:conversation", conversationId);
};

export const emitTyping = (conversationId: string, userId: string) => {
  socket?.emit("message:typing", { conversationId, userId });
};
