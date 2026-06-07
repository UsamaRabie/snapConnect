"use client";

import { useState, useRef, useCallback } from "react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
  size?: number;
  showCount?: boolean;
  className?: string;
  onCountClick?: () => void;
}

export function LikeButton({
  isLiked,
  likesCount,
  onLike,
  size = 22,
  showCount = true,
  className = "",
  onCountClick,
}: LikeButtonProps) {
  const [animating, setAnimating] = useState(false);
  const lastTap = useRef(0);

  const handleClick = useCallback(() => {
    onLike();
    if (!isLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }
  }, [onLike, isLiked]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) {
        onLike();
        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);
      }
    }
    lastTap.current = now;
  }, [onLike, isLiked]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        onTouchEnd={handleDoubleTap}
        className="relative transition-transform active:scale-110"
        aria-label={isLiked ? "Unlike" : "Like"}
      >
        <Heart
          size={size}
          className={`transition-all duration-200 ${
            isLiked
              ? "fill-red-500 text-red-500"
              : "text-dark-50 hover:text-red-400"
          }`}
        />
      </button>

      {animating && (
        <Heart
          size={size * 2}
          className="absolute -top-1/2 -left-1/2 animate-ping text-red-500 pointer-events-none opacity-50"
          style={{ animation: "likePing 0.6s ease-out" }}
        />
      )}

      {showCount && (
        <p
          className={`text-sm font-semibold text-dark-50 mt-1${onCountClick ? " cursor-pointer hover:underline" : ""}`}
          onClick={onCountClick}
        >
          {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
        </p>
      )}

      <style jsx>{`
        @keyframes likePing {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
