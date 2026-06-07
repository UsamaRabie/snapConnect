"use client";

import { useState, useEffect, useCallback } from "react";
import type { IComment } from "@/types";
import { commentApi } from "@/lib/api.service";
import { Button } from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getAvatarUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { connectSocket } from "@/lib/socket";
import { CommentThread } from "./CommentThread";

interface CommentSectionProps {
  postId: string;
  onCommentsCountChange?: (delta: number) => void;
}

const removeFromTree = (comments: IComment[], targetId: string): IComment[] =>
  comments
    .filter((c) => c._id !== targetId)
    .map((c) => ({
      ...c,
      children: c.children ? removeFromTree(c.children, targetId) : [],
    }));

const updateInTree = (
  comments: IComment[],
  targetId: string,
  updater: (c: IComment) => IComment
): IComment[] =>
  comments.map((c) => {
    if (c._id === targetId) return updater(c);
    return { ...c, children: c.children ? updateInTree(c.children, targetId, updater) : [] };
  });

const insertInTree = (
  comments: IComment[],
  parentId: string | null,
  comment: IComment
): IComment[] => {
  if (!parentId) return [comment, ...comments];
  return comments.map((c) => {
    if (c._id === parentId) {
      return { ...c, children: [comment, ...(c.children || [])] };
    }
    return { ...c, children: c.children ? insertInTree(c.children, parentId, comment) : [] };
  });
};

export function CommentSection({ postId, onCommentsCountChange }: CommentSectionProps) {
  const { user: currentUser } = useAuthStore();
  const [comments, setComments] = useState<IComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const result = await commentApi.getComments(postId, 1, 10);
      setComments(result.comments);
      setHasMore(result.pagination.page < result.pagination.totalPages);
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
      onCommentsCountChange?.(1);
      setComments((prev) => {
        if (containsId(prev, data.comment._id)) return prev;
        return insertInTree(prev, data.comment.parentComment || null, {
          ...data.comment,
          children: [],
        });
      });
    };

    const handleUpdated = (data: { postId: string; commentId: string; text: string; updatedAt: string }) => {
      if (data.postId !== postId) return;
      setComments((prev) =>
        updateInTree(prev, data.commentId, (c) => ({
          ...c,
          text: data.text,
          updatedAt: data.updatedAt,
        }))
      );
    };

    const handleDeleted = (data: { postId: string; commentId: string }) => {
      if (data.postId !== postId) return;
      onCommentsCountChange?.(-1);
      setComments((prev) => removeFromTree(prev, data.commentId));
    };

    socket.on("comment:created", handleCreated);
    socket.on("comment:updated", handleUpdated);
    socket.on("comment:deleted", handleDeleted);

    return () => {
      socket.emit("leave:post", postId);
      socket.off("comment:created", handleCreated);
      socket.off("comment:updated", handleUpdated);
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
        if (containsId(prev, comment._id)) return prev;
        return [comment, ...prev];
      });
      onCommentsCountChange?.(1);
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
        if (containsId(prev, comment._id)) return prev;
        return insertInTree(prev, comment.parentComment || null, { ...comment, children: [] });
      });
      onCommentsCountChange?.(1);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const next = page + 1;
      const result = await commentApi.getComments(postId, next, 10);
      setComments((prev) => {
        const existing = new Set(prev.map((c) => c._id));
        const newOnes = result.comments.filter((c) => !existing.has(c._id));
        return [...prev, ...newOnes];
      });
      setPage(next);
      setHasMore(next < result.pagination.totalPages);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCommentUpdate = (commentId: string, text: string, updatedAt: string) => {
    setComments((prev) =>
      updateInTree(prev, commentId, (c) => ({ ...c, text, updatedAt }))
    );
  };

  const handleCommentDelete = (commentId: string) => {
    setComments((prev) => removeFromTree(prev, commentId));
  };

  if (isLoading) {
    return <LoadingSpinner className="py-4" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
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
            className="flex-1 rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />
          <Button size="sm" onClick={handleSubmit} disabled={!text.trim() || isSubmitting} isLoading={isSubmitting}>
            Post
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-dark-400 py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
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
          ))
        )}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="w-full py-2 text-sm text-primary-500 hover:text-primary-400 disabled:opacity-50"
          >
            {isLoadingMore ? "Loading..." : "Load more comments"}
          </button>
        )}
      </div>
    </div>
  );
}

function containsId(comments: IComment[], id: string): boolean {
  for (const c of comments) {
    if (c._id === id) return true;
    if (c.children && containsId(c.children, id)) return true;
  }
  return false;
}
