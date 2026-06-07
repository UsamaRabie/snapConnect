"use client";

import { cn } from "@/lib/utils";

interface PostCardSkeletonProps {
  className?: string;
}

export function PostCardSkeleton({ className }: PostCardSkeletonProps) {
  return (
    <article
      className={cn(
        "rounded-xl border border-dark-600 bg-dark-800 overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="h-8 w-8 rounded-full bg-dark-700 animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-24 rounded bg-dark-700 animate-pulse" />
          <div className="h-2.5 w-16 rounded bg-dark-700/60 animate-pulse" />
        </div>
      </div>

      <div className="aspect-square w-full bg-dark-700 animate-pulse" />

      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded bg-dark-700 animate-pulse" />
            <div className="h-5 w-5 rounded bg-dark-700 animate-pulse" />
          </div>
          <div className="h-5 w-5 rounded bg-dark-700 animate-pulse" />
        </div>
        <div className="h-3 w-20 rounded bg-dark-700 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-dark-700/60 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-dark-700/60 animate-pulse" />
        </div>
        <div className="h-2.5 w-32 rounded bg-dark-700/40 animate-pulse" />
        <div className="h-2 w-16 rounded bg-dark-700/30 animate-pulse" />
      </div>
    </article>
  );
}
