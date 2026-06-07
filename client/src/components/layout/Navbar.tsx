"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Heart, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationDropdown } from "@/components/notification/NotificationDropdown";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { userApi } from "@/lib/api.service";
import type { IUser } from "@/types";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount, initSocketListener } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<IUser[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    const cleanup = initSocketListener();
    return cleanup;
  }, [fetchUnreadCount, initSocketListener]);

  useEffect(() => {
    if (!notifOpen) {
      fetchUnreadCount();
    }
  }, [notifOpen, fetchUnreadCount]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      setSuggestOpen(false);
      return;
    }

    setIsSuggesting(true);
    setSuggestOpen(true);
    debounceRef.current = setTimeout(async () => {
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
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (!trimmed) return;
      setSuggestOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [searchQuery, router]
  );

  const handleSuggestionSelect = useCallback(() => {
    setSuggestOpen(false);
    setSearchQuery("");
    setSuggestions([]);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setSuggestOpen(false), 200);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-dark-600 bg-dark-900/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="p-2 text-dark-300 hover:text-dark-50 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/feed" className="text-xl font-bold text-dark-50">
            SnapConnect
          </Link>
        </div>

        <div
          ref={searchRef}
          className="hidden md:flex relative"
        >
          <form onSubmit={handleSearchSubmit}>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none"
              size={18}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setSuggestOpen(true);
              }}
              onBlur={handleSearchBlur}
              className="w-60 rounded-lg bg-dark-800 border border-dark-600 py-1.5 pl-10 pr-3 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
            />
          </form>
          <SearchSuggestions
            query={searchQuery}
            suggestions={suggestions}
            isOpen={suggestOpen}
            isLoading={isSuggesting}
            onClose={() => setSuggestOpen(false)}
            onSelect={handleSuggestionSelect}
          />
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2 text-dark-300 hover:text-dark-50 transition-colors"
            >
              <Heart size={24} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
            />
          </div>

          <Link
            href={`/profile/${user?.id}`}
            className="h-7 w-7 overflow-hidden rounded-full border border-dark-500"
          >
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || "U"}&background=0ea5e9&color=fff`}
              alt={user?.username}
              className="h-full w-full object-cover"
            />
          </Link>
          <button
            onClick={logout}
            className="p-2 text-dark-300 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
