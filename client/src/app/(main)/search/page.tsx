"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, Users, RefreshCw } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { FollowButton } from "@/components/follow/FollowButton";
import { getAvatarUrl, formatCount } from "@/lib/utils";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const {
    query,
    setQuery,
    searchResults,
    isSearching,
    searchError,
    pagination,
    executeSearch,
    loadMore,
    hasMore,
  } = useSearch();

  useEffect(() => {
    if (q) {
      setQuery(q);
    }
  }, [q, setQuery]);

  useEffect(() => {
    if (query.trim()) {
      executeSearch(1);
    }
  }, [query, executeSearch]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        executeSearch(1);
      }
    },
    [query, executeSearch]
  );

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isSearching,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-dark-50">Search</h1>
        <p className="text-sm text-dark-400 mt-1">
          Find people by username or full name
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-lg border border-dark-600 bg-dark-800 py-2.5 pl-10 pr-4 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
          autoFocus
        />
      </form>

      {searchError && (
        <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 text-center space-y-3">
          <p className="text-sm text-dark-400">{searchError}</p>
          <button
            onClick={() => executeSearch(1)}
            className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      )}

      {!query.trim() && !isSearching && searchResults.length === 0 && (
        <div className="rounded-xl border border-dark-600 bg-dark-800 p-12 text-center">
          <Users size={48} className="mx-auto mb-3 text-dark-600" />
          <p className="text-dark-400">
            Search for people by username or full name
          </p>
        </div>
      )}

      {isSearching && searchResults.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-primary-500" />
        </div>
      ) : searchResults.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-dark-500 px-1">
            Results ({pagination?.total || 0})
          </p>
          <div className="rounded-xl border border-dark-600 bg-dark-800 divide-y divide-dark-600 overflow-hidden">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-dark-750 transition-colors"
              >
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
                    <img
                      src={getAvatarUrl(user.avatar, user.username)}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-50 truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-dark-400 truncate">
                      {user.fullName}
                      <span className="ml-2 text-dark-500">
                        {formatCount(user.followersCount)} followers
                      </span>
                    </p>
                  </div>
                </Link>
                <FollowButton
                  userId={user.id}
                  isFollowing={!!(user as any).isFollowing}
                  size="sm"
                />
              </div>
            ))}
          </div>

          <div ref={sentinelRef} className="py-4">
            {isSearching && searchResults.length > 0 && (
              <div className="flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-dark-400" />
              </div>
            )}
            {!hasMore && searchResults.length > 0 && (
              <p className="text-center text-xs text-dark-500 py-2">
                All results loaded
              </p>
            )}
          </div>
        </div>
      )}

      {!isSearching && query.trim() && searchResults.length === 0 && !searchError && (
        <div className="rounded-xl border border-dark-600 bg-dark-800 p-12 text-center">
          <Search size={48} className="mx-auto mb-3 text-dark-600" />
          <p className="text-dark-400">
            No users found for &ldquo;{query}&rdquo;
          </p>
          <p className="text-sm text-dark-500 mt-1">
            Try searching with a different name
          </p>
        </div>
      )}
    </div>
  );
}
