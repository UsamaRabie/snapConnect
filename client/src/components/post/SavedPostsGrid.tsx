"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import type { IPost } from "@/types";
import { postApi } from "@/lib/api.service";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatCount } from "@/lib/utils";

export function SavedPostsGrid() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await postApi.getSaved(1);
        setPosts(result.posts);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <LoadingSpinner className="py-8" />;

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dark-600 bg-dark-800 py-16">
        <Bookmark size={32} className="text-dark-500 mb-2" />
        <p className="text-dark-400">No saved posts yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <Link
          key={post._id}
          href={`/post/${post._id}`}
          className="group relative aspect-square overflow-hidden bg-dark-900"
        >
          {post.image && (
            <img
              src={post.image}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-1 text-sm font-semibold text-dark-50">
              <Heart size={16} className="fill-dark-50" />
              {formatCount(post.likesCount)}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-dark-50">
              <MessageCircle size={16} className="fill-dark-50" />
              {formatCount(post.commentsCount)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
