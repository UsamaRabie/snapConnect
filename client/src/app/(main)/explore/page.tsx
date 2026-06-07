"use client";

import { useEffect } from "react";
import { PostGrid } from "@/components/post/PostGrid";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useExplorePosts } from "@/hooks/usePost";

export default function ExplorePage() {
  const { posts, isLoading, fetchPosts } = useExplorePosts();

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-dark-50">Explore</h1>
      {isLoading && posts.length === 0 ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : (
        <PostGrid posts={posts} />
      )}
    </div>
  );
}
