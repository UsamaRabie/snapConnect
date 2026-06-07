"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import type { IUser } from "@/types";
import { getAvatarUrl, formatCount } from "@/lib/utils";

interface SearchSuggestionsProps {
  query: string;
  suggestions: IUser[];
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export function SearchSuggestions({
  query,
  suggestions,
  isOpen,
  isLoading,
  onClose,
  onSelect,
}: SearchSuggestionsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-dark-600 bg-dark-900 shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-dark-400" />
        </div>
      ) : suggestions.length === 0 ? (
        query.trim().length >= 2 ? (
          <div className="px-4 py-6 text-center text-sm text-dark-400">
            <Search size={24} className="mx-auto mb-2 text-dark-600" />
            No users found for &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-dark-400">
            Type at least 2 characters to search
          </div>
        )
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-dark-500">
            Users
          </div>
          {suggestions.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              onClick={onSelect}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-dark-800"
            >
              <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
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
                </p>
              </div>
              <span className="text-xs text-dark-500 flex-shrink-0">
                {formatCount(user.followersCount)} followers
              </span>
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            onClick={onSelect}
            className="flex items-center justify-center gap-2 border-t border-dark-600 px-4 py-3 text-sm text-primary-500 hover:text-primary-400 transition-colors"
          >
            <Search size={16} />
            See all results for &ldquo;{query}&rdquo;
          </Link>
        </div>
      )}
    </div>
  );
}
