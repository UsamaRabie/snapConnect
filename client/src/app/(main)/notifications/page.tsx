"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, MessageCircle, UserPlus, Reply, Tag, Send, ArrowLeft, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { notificationApi } from "@/lib/api.service";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getAvatarUrl, formatDate } from "@/lib/utils";
import type { INotification } from "@/types";

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
    case "like": return "liked your post";
    case "comment": return "commented on your post";
    case "reply": return "replied to your comment";
    case "follow": return "started following you";
    case "tag": return "tagged you in a post";
    case "message": return "sent you a message";
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { markAsRead, markAllAsRead, fetchUnreadCount } = useNotificationStore();

  const load = useCallback(async (p: number) => {
    if (p === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const result = await notificationApi.getNotifications(p);
      setNotifications((prev) => (p === 1 ? result.notifications : [...prev, ...result.notifications]));
      setHasMore(result.pagination ? result.pagination.page < result.pagination.totalPages : false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetchUnreadCount();
  };

  const handleClick = async (n: INotification) => {
    if (!n.isRead) {
      await markAsRead(n._id);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      fetchUnreadCount();
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/feed" className="text-dark-400 hover:text-dark-50 transition-colors">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-xl font-bold text-dark-50">Notifications</h1>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dark-600 bg-dark-800 py-16 text-center">
          <p className="text-dark-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <Link
              key={n._id}
              href={getLink(n)}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-dark-800 ${
                !n.isRead ? "border-l-2 border-primary-500 bg-dark-900" : ""
              }`}
            >
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
                <img
                  src={getAvatarUrl(n.sender.avatar, n.sender.username)}
                  alt={n.sender.username}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-dark-200">
                  <span className="font-semibold text-dark-50">{n.sender.username}</span>{" "}
                  {getMessage(n)}
                </p>
                <span className="text-xs text-dark-500">{formatDate(n.createdAt)}</span>
              </div>
              <div className="flex-shrink-0 mt-1">{iconMap[n.type]}</div>
            </Link>
          ))}
          {hasMore && (
            <div className="py-4 text-center">
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  load(next);
                }}
                disabled={isLoadingMore}
                className="text-sm text-primary-500 hover:text-primary-400 disabled:opacity-50"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
