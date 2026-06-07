"use client";

import { useEffect, useState, useCallback } from "react";
import { PostCard } from "@/components/post/PostCard";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { CreatePost } from "@/components/post/CreatePost";
import { SuggestedUsers } from "@/components/follow/SuggestedUsers";
import { useFeedPosts } from "@/hooks/usePost";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { RefreshCw } from "lucide-react";

export default function FeedPage() {
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchPosts,
    loadMore,
    deletePost,
    refreshPosts,
  } = useFeedPosts();

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchPosts(1).finally(() => setInitialLoad(false));
  }, [fetchPosts]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoadingMore,
  });

  const handleRetry = useCallback(() => {
    refreshPosts();
  }, [refreshPosts]);

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6 min-w-0">
        <CreatePost onSuccess={refreshPosts} />

        {error && posts.length === 0 ? (
          <div className="rounded-xl border border-dark-600 bg-dark-800 p-8 text-center space-y-3">
            <p className="text-dark-400">{error}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : initialLoad || (isLoading && posts.length === 0) ? (
          <div className="space-y-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dark-600 bg-dark-800 p-8 text-center space-y-3">
            <p className="text-dark-400">
              No posts yet. Follow users to see their posts here.
            </p>
            <p className="text-sm text-dark-500">
              Use the search to find people or check out suggested users.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={deletePost}
                />
              ))}
            </div>

            <div ref={sentinelRef} className="py-4">
              {isLoadingMore && (
                <div className="space-y-4">
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-center text-xs text-dark-500 py-4">
                  You&apos;re all caught up
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="hidden xl:block w-80 flex-shrink-0">
        <div className="sticky top-20">
          <SuggestedUsers />
        </div>
      </div>
    </div>
  );
}
