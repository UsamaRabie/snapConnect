"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, UserPlus, Reply, Tag, CheckCheck, Send } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { getAvatarUrl, formatDate } from "@/lib/utils";
import type { INotification } from "@/types";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<INotification["type"], React.ReactNode> = {
  like: <Heart size={14} className="text-red-500" />,
  comment: <MessageCircle size={14} className="text-blue-500" />,
  reply: <Reply size={14} className="text-green-500" />,
  follow: <UserPlus size={14} className="text-primary-500" />,
  tag: <Tag size={14} className="text-yellow-500" />,
  message: <Send size={14} className="text-primary-500" />,
};

const getMessage = (n: INotification): string => {
  switch (n.type) {
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "reply":
      return "replied to your comment";
    case "follow":
      return "started following you";
    case "tag":
      return "tagged you in a post";
    case "message":
      return "sent you a message";
  }
};

const getLink = (n: INotification): string => {
  switch (n.type) {
    case "like":
    case "comment":
    case "reply":
    case "tag":
      return n.post ? `/post/${n.post}` : "#";
    case "message":
      return "/messages";
    case "follow":
      return `/profile/${n.sender.id}`;
  }
};

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchNotifications(), fetchUnreadCount()]).finally(() =>
        setLoading(false)
      );
    }
  }, [isOpen, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleNotificationClick = (n: INotification) => {
    if (!n.isRead) {
      markAsRead(n._id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-dark-600 bg-dark-900 shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600">
        <h3 className="text-sm font-semibold text-dark-50">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-dark-400">
            No notifications yet
          </p>
        ) : (
          <>
            {notifications.slice(0, 10).map((n) => (
              <Link
                key={n._id}
                href={getLink(n)}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-dark-800 ${
                  !n.isRead ? "bg-dark-900 border-l-2 border-primary-500" : ""
                }`}
              >
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
                  <img
                    src={getAvatarUrl(n.sender.avatar, n.sender.username)}
                    alt={n.sender.username}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-200">
                    <span className="font-semibold text-dark-50">
                      {n.sender.username}
                    </span>{" "}
                    {getMessage(n)}
                  </p>
                  <span className="text-xs text-dark-500">{formatDate(n.createdAt)}</span>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {iconMap[n.type]}
                </div>
              </Link>
            ))}
            <Link
              href="/notifications"
              onClick={onClose}
              className="flex items-center justify-center border-t border-dark-600 px-4 py-3 text-sm text-primary-500 hover:text-primary-400 transition-colors"
            >
              View all notifications
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
