"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { IUser } from "@/types";
import { userApi } from "@/lib/api.service";

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  suggestions: IUser[];
  isSuggesting: boolean;
  searchResults: IUser[];
  isSearching: boolean;
  searchError: string | null;
  pagination: any;
  executeSearch: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  clear: () => void;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<IUser[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    setIsSuggesting(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await userApi.searchSuggestions(trimmed);
        setSuggestions(result.users);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const executeSearch = useCallback(
    async (page = 1) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setIsSearching(true);
      setSearchError(null);

      try {
        const result = await userApi.search(trimmed, page);
        setSearchResults((prev) =>
          page === 1 ? result.users : [...prev, ...result.users]
        );
        setPagination(result.pagination);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Search failed";
        setSearchError(message);
      } finally {
        setIsSearching(false);
      }
    },
    [query]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isSearching) return;
    const nextPage = (pagination?.page || 0) + 1;
    await executeSearch(nextPage);
  }, [hasMore, isSearching, pagination, executeSearch]);

  const clear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setSearchResults([]);
    setSearchError(null);
    setPagination(null);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isSuggesting,
    searchResults,
    isSearching,
    searchError,
    pagination,
    executeSearch,
    loadMore,
    hasMore,
    clear,
  };
}
