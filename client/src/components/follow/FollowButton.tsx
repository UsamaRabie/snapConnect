"use client";

import { useState } from "react";
import { UserMinus, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { userApi } from "@/lib/api.service";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollow?: (userId: string, nowFollowing: boolean) => void;
  size?: "sm" | "md";
}

export function FollowButton({
  userId,
  isFollowing: initialFollowing,
  onFollow,
  size = "md",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        await userApi.unfollow(userId);
        setIsFollowing(false);
        onFollow?.(userId, false);
      } else {
        await userApi.follow(userId);
        setIsFollowing(true);
        onFollow?.(userId, true);
      }
    } catch (err) {
      console.error("Follow action failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center justify-center rounded-lg border font-medium transition-colors",
          size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
          "border-dark-600 bg-dark-800 text-dark-400 cursor-not-allowed"
        )}
      >
        <Loader2 size={size === "sm" ? 12 : 14} className="animate-spin" />
      </button>
    );
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border font-medium transition-all",
          size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
          isHovering
            ? "border-red-500/50 bg-red-500/10 text-red-400"
            : "border-dark-600 bg-dark-800 text-dark-200 hover:bg-dark-700"
        )}
      >
        {isHovering ? (
          <>
            <UserMinus size={size === "sm" ? 12 : 14} className="mr-1" />
            Unfollow
          </>
        ) : (
          "Following"
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border-0 font-medium transition-colors",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        "bg-primary-500 text-white hover:bg-primary-600"
      )}
    >
      <UserPlus size={size === "sm" ? 12 : 14} className="mr-1" />
      Follow
    </button>
  );
}
