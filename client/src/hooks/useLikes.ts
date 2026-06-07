"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { postApi } from "@/lib/api.service";
import { getSocket, connectSocket } from "@/lib/socket";

interface UseLikeReturn {
  isLiked: boolean;
  likesCount: number;
  toggleLike: () => Promise<void>;
  optimisticToggled: boolean;
}

export function useLike(
  postId: string,
  initialIsLiked: boolean,
  initialLikesCount: number
): UseLikeReturn {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [optimisticToggled, setOptimisticToggled] = useState(false);
  const socketInitialized = useRef(false);

  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikesCount(initialLikesCount);
  }, [initialIsLiked, initialLikesCount]);

  useEffect(() => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const socket = connectSocket();
    if (!socket) return;

    socket.emit("join:post", postId);

    const handleLikeEvent = (data: { postId: string; userId: string; likesCount: number; isLiked: boolean }) => {
      if (data.postId === postId) {
        setLikesCount(data.likesCount);
        setIsLiked(data.isLiked);
      }
    };

    socket.on("post:like", handleLikeEvent);

    return () => {
      socket.emit("leave:post", postId);
      socket.off("post:like", handleLikeEvent);
    };
  }, [postId]);

  const toggleLike = useCallback(async () => {
    const wasLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!wasLiked);
    setLikesCount(wasLiked ? likesCount - 1 : likesCount + 1);
    setOptimisticToggled(true);

    try {
      if (wasLiked) {
        await postApi.unlike(postId);
      } else {
        await postApi.like(postId);
      }
    } catch {
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
    } finally {
      setOptimisticToggled(false);
    }
  }, [postId, isLiked, likesCount]);

  return { isLiked, likesCount, toggleLike, optimisticToggled };
}
