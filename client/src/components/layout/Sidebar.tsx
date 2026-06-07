"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Compass,
  MessageCircle,
  Heart,
  PlusSquare,
  User,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/create", label: "Create", icon: PlusSquare },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-56 border-r border-dark-600 bg-dark-900 transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 pt-2 pb-1 lg:hidden">
          <span className="text-sm font-semibold text-dark-50">Menu</span>
          <button
            onClick={onClose}
            className="p-1 text-dark-400 hover:text-dark-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  isActive
                    ? "bg-dark-800 text-dark-50"
                    : "text-dark-300 hover:bg-dark-700 hover:text-dark-50"
                )}
              >
                <Icon size={22} />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}
          <Link
            href={`/profile/${user?.id}`}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
              pathname === `/profile/${user?.id}`
                ? "bg-dark-800 text-dark-50"
                : "text-dark-300 hover:bg-dark-700 hover:text-dark-50"
            )}
          >
            <User size={22} />
            <span className="text-sm">Profile</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-dark-300 hover:bg-dark-700 hover:text-dark-50 transition-colors mt-2"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
            <span className="text-sm">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
