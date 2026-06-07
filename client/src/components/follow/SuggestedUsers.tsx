"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import type { IUser } from "@/types";
import { userApi } from "@/lib/api.service";
import { FollowButton } from "./FollowButton";
import { getAvatarUrl } from "@/lib/utils";

export function SuggestedUsers() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await userApi.getSuggestedUsers();
      setUsers(result.users);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-4">
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-dark-400" />
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="rounded-xl border border-dark-600 bg-dark-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dark-200">
          Suggested for you
        </h2>
        <button
          onClick={load}
          className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {users.slice(0, 5).map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3"
          >
            <Link
              href={`/profile/${u.id}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-dark-600">
                <img
                  src={getAvatarUrl(u.avatar, u.username)}
                  alt={u.username}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-dark-50">
                  {u.username}
                </p>
                <p className="truncate text-xs text-dark-400">
                  {u.followersCount.toLocaleString()} followers
                </p>
              </div>
            </Link>
            <FollowButton userId={u.id} isFollowing={false} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
