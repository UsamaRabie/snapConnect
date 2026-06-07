"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, UserX } from "lucide-react";
import type { IUser } from "@/types";
import { userApi } from "@/lib/api.service";
import { Modal } from "@/components/common/Modal";
import { FollowButton } from "./FollowButton";
import { useAuthStore } from "@/store/authStore";
import { getAvatarUrl } from "@/lib/utils";

interface FollowingModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowingModal({
  userId,
  isOpen,
  onClose,
}: FollowingModalProps) {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await userApi.getFollowing(userId);
        setUsers(result.users);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Following">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-dark-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-dark-400">
          <UserX size={32} className="mb-2" />
          <p className="text-sm">Not following anyone yet</p>
        </div>
      ) : (
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-dark-700 transition-colors"
            >
              <Link
                href={`/profile/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-dark-600">
                  <img
                    src={getAvatarUrl(u.avatar, u.username)}
                    alt={u.username}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark-50">
                    {u.fullName}
                  </p>
                  <p className="truncate text-xs text-dark-400">
                    @{u.username}
                  </p>
                </div>
              </Link>
              {currentUser && u.id !== currentUser.id && (
                <FollowButton
                  userId={u.id}
                  isFollowing={true}
                  size="sm"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
