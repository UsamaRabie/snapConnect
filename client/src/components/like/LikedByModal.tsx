"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { IUser } from "@/types";
import { postApi } from "@/lib/api.service";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getAvatarUrl, formatCount } from "@/lib/utils";

interface LikedByModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LikedByModal({ postId, isOpen, onClose }: LikedByModalProps) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadLikes = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const result = await postApi.getLikes(postId, pageNum);
      setUsers((prev) => (pageNum === 1 ? result.users : [...prev, ...result.users]));
      setHasMore(result.pagination.page < result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setUsers([]);
      loadLikes(1);
    }
  }, [isOpen, loadLikes]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-dark-600 bg-dark-800">
        <div className="flex items-center justify-between border-b border-dark-600 px-4 py-3">
          <h2 className="text-base font-semibold text-dark-50">Likes</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-50">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && users.length === 0 ? (
            <LoadingSpinner className="py-8" />
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-dark-400">
              No likes yet
            </p>
          ) : (
            <div className="divide-y divide-dark-600">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
                    <img
                      src={getAvatarUrl(user.avatar, user.username)}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dark-50 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-dark-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                  {(user as any).followersCount !== undefined && (
                    <p className="text-xs text-dark-500 flex-shrink-0">
                      {formatCount((user as any).followersCount)} followers
                    </p>
                  )}
                </Link>
              ))}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      loadLikes(next);
                    }}
                    disabled={isLoading}
                    className="text-sm text-primary-500 hover:underline disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
