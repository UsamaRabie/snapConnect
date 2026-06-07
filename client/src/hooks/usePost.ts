"use client";

import { useState, useCallback } from "react";
import type { IPost, Pagination } from "@/types";
import { postApi } from "@/lib/api.service";

interface UseFeedPostsReturn {
  posts: IPost[];
  pagination: Pagination | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchPosts: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  toggleLike: (postId: string, isLiked: boolean) => void;
  deletePost: (postId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

export function useFeedPosts(): UseFeedPostsReturn {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (page = 1) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    try {
      const result = await postApi.getFeed(page);
      setPosts((prev) =>
        page === 1 ? result.posts : [...prev, ...result.posts]
      );
      setPagination(result.pagination);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load posts";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const hasMore = pagination
    ? pagination.page < pagination.totalPages
    : false;

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    const nextPage = (pagination?.page || 0) + 1;
    await fetchPosts(nextPage);
  }, [hasMore, isLoadingMore, isLoading, pagination, fetchPosts]);

  const refreshPosts = useCallback(async () => {
    setPosts([]);
    setPagination(null);
    await fetchPosts(1);
  }, [fetchPosts]);

  const toggleLike = useCallback(
    (postId: string, isLiked: boolean) => {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                isLiked: !isLiked,
                likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p
        )
      );
      const action = isLiked ? postApi.unlike(postId) : postApi.like(postId);
      action.catch(() => {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  isLiked,
                  likesCount: isLiked
                    ? p.likesCount + 1
                    : p.likesCount - 1,
                }
              : p
          )
        );
      });
    },
    []
  );

  const deletePost = useCallback(async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    try {
      await postApi.delete(postId);
    } catch {
      setPosts((prev) => [...prev]);
    }
  }, []);

  return {
    posts,
    pagination,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchPosts,
    loadMore,
    toggleLike,
    deletePost,
    refreshPosts,
  };
}

interface UseExplorePostsReturn {
  posts: IPost[];
  pagination: Pagination | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  fetchPosts: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useExplorePosts(): UseExplorePostsReturn {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (page = 1) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const result = await postApi.explore(page);
      setPosts((prev) =>
        page === 1 ? result.posts : [...prev, ...result.posts]
      );
      setPagination(result.pagination);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const hasMore = pagination
    ? pagination.page < pagination.totalPages
    : false;

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    const nextPage = (pagination?.page || 0) + 1;
    await fetchPosts(nextPage);
  }, [hasMore, isLoadingMore, isLoading, pagination, fetchPosts]);

  return {
    posts,
    pagination,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchPosts,
    loadMore,
  };
}
