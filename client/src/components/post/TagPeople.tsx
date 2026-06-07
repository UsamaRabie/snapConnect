"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import type { IUser } from "@/types";
import { userApi } from "@/lib/api.service";
import { getAvatarUrl } from "@/lib/utils";

interface TagPeopleProps {
  selected: IUser[];
  onChange: (users: IUser[]) => void;
}

export function TagPeople({ selected, onChange }: TagPeopleProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await userApi.search(query.trim(), 1);
        setResults(res.users.filter((u) => !selected.some((s) => s.id === u.id)));
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected]);

  const addUser = (user: IUser) => {
    onChange([...selected, user]);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeUser = (userId: string) => {
    onChange(selected.filter((u) => u.id !== userId));
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selected.map((u) => (
          <span
            key={u.id}
            className="flex items-center gap-1 rounded-full bg-primary-500/20 px-2.5 py-1 text-xs text-primary-500"
          >
            <img src={getAvatarUrl(u.avatar, u.username)} alt="" className="h-4 w-4 rounded-full object-cover" />
            @{u.username}
            <button onClick={() => removeUser(u.id)} className="ml-0.5 hover:text-dark-50">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Tag people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full rounded-lg border border-dark-600 bg-dark-900 pl-8 pr-3 py-1.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
        />
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-dark-600 bg-dark-800 shadow-lg max-h-48 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.id}
              onMouseDown={() => addUser(u)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-dark-50 hover:bg-dark-700"
            >
              <img src={getAvatarUrl(u.avatar, u.username)} alt="" className="h-6 w-6 rounded-full object-cover" />
              <span className="font-medium">{u.username}</span>
              <span className="text-dark-400 text-xs truncate">{u.fullName}</span>
            </button>
          ))}
        </div>
      )}
      {isSearching && (
        <p className="mt-1 text-xs text-dark-400">Searching...</p>
      )}
    </div>
  );
}
