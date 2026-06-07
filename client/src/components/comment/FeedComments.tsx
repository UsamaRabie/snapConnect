"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { IComment } from "@/types";
import { commentApi } from "@/lib/api.service";
import { getAvatarUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { connectSocket } from "@/lib/socket";
import { CommentThread } from "./CommentThread";

const MAX_VISIBLE = 3;

interface FeedCommentsProps {
  postId: string;
  commentsCount: number;
}

export function FeedComments({ postId, commentsCount }: FeedCommentsProps) {
  const { user: currentUser } = useAuthStore();
  const [comments, setComments] = useState<IComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const result = await commentApi.getComments(postId, 1, MAX_VISIBLE);
      setComments(result.comments);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    socket.emit("join:post", postId);
    const handleCreated = (data: { postId: string; comment: IComment }) => {
      if (data.postId !== postId) return;
      setComments((prev) => {
        if (prev.some((c) => c._id === data.comment._id || c.children?.some((ch) => ch._id === data.comment._id))) return prev;
        if (data.comment.parentComment) {
          return prev.map((c) => {
            if (c._id === data.comment.parentComment) {
              return { ...c, children: [data.comment, ...(c.children || [])] };
            }
            return c;
          });
        }
        return [data.comment, ...prev].slice(0, MAX_VISIBLE);
      });
    };
    const handleDeleted = (data: { postId: string; commentId: string }) => {
      if (data.postId !== postId) return;
      setComments((prev) => {
        const filtered = prev.filter((c) => c._id !== data.commentId);
        return filtered.map((c) => ({
          ...c,
          children: c.children?.filter((ch) => ch._id !== data.commentId) || [],
        }));
      });
    };
    socket.on("comment:created", handleCreated);
    socket.on("comment:deleted", handleDeleted);
    return () => {
      socket.emit("leave:post", postId);
      socket.off("comment:created", handleCreated);
      socket.off("comment:deleted", handleDeleted);
    };
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const trimmed = text.trim();
    setText("");
    try {
      const comment = await commentApi.create(postId, trimmed);
      setComments((prev) => {
        if (prev.some((c) => c._id === comment._id)) return prev;
        return [comment, ...prev].slice(0, MAX_VISIBLE);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !replyTo || isSubmittingReply) return;
    setIsSubmittingReply(true);
    const trimmed = replyText.trim();
    setReplyText("");
    setReplyTo(null);
    try {
      const comment = await commentApi.create(postId, trimmed, replyTo);
      setComments((prev) => {
        if (prev.some((c) => c._id === comment._id || c.children?.some((ch) => ch._id === comment._id))) return prev;
        return prev.map((c) =>
          c._id === replyTo
            ? { ...c, children: [comment, ...(c.children || [])] }
            : c
        );
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleCommentUpdate = (commentId: string, text: string, updatedAt: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) return { ...c, text, updatedAt };
        return { ...c, children: c.children?.map((ch) => ch._id === commentId ? { ...ch, text, updatedAt } : ch) };
      })
    );
  };

  const handleCommentDelete = (commentId: string) => {
    setComments((prev) =>
      prev.filter((c) => c._id !== commentId).map((c) => ({
        ...c,
        children: c.children?.filter((ch) => ch._id !== commentId) || [],
      }))
    );
  };

  if (isLoading) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
          <img
            src={getAvatarUrl(currentUser?.avatar, currentUser?.username)}
            alt="You"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="flex-1 rounded-lg border border-dark-600 bg-dark-900 px-3 py-1.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="text-sm font-semibold text-primary-500 hover:text-primary-400 disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Post"}
          </button>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentThread
              key={comment._id}
              comment={comment}
              postId={postId}
              depth={0}
              onReply={(id) => setReplyTo(replyTo === id ? null : id)}
              replyTarget={replyTo}
              replyText={replyText}
              onReplyTextChange={setReplyText}
              onSubmitReply={handleReplySubmit}
              isSubmittingReply={isSubmittingReply}
              onCancelReply={() => { setReplyTo(null); setReplyText(""); }}
              onCommentUpdate={handleCommentUpdate}
              onCommentDelete={handleCommentDelete}
            />
          ))}
        </div>
      )}

      {commentsCount > MAX_VISIBLE && (
        <Link
          href={`/post/${postId}`}
          className="block text-xs text-dark-400 hover:text-dark-300"
        >
          View all {formatCount(commentsCount)} comments
        </Link>
      )}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
