"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { IPost } from "@/types";
import { formatCount } from "@/lib/utils";

interface PostGridProps {
  posts: IPost[];
}

export function PostGrid({ posts }: PostGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <Link
          key={post._id}
          href={`/post/${post._id}`}
          className="group relative aspect-square overflow-hidden bg-dark-800"
        >
          <img
            src={post.image || "/placeholder.svg"}
            alt={post.caption || "Post"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-1 text-sm font-semibold text-dark-50">
              <Heart size={18} className="fill-dark-50" />
              {formatCount(post.likesCount)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
