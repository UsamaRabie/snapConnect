"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, X, Check, MessageCircle } from "lucide-react";
import type { IComment } from "@/types";
import { commentApi } from "@/lib/api.service";
import { Button } from "@/components/common/Button";
import { getAvatarUrl, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface CommentThreadProps {
  comment: IComment;
  postId: string;
  depth?: number;
  onReply: (commentId: string) => void;
  replyTarget: string | null;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: () => void;
  isSubmittingReply: boolean;
  onCancelReply: () => void;
  onCommentUpdate: (commentId: string, text: string, updatedAt: string) => void;
  onCommentDelete: (commentId: string) => void;
}

export function CommentThread({
  comment,
  postId,
  depth = 0,
  onReply,
  replyTarget,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  isSubmittingReply,
  onCancelReply,
  onCommentUpdate,
  onCommentDelete,
}: CommentThreadProps) {
  const { user: currentUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChildren, setShowChildren] = useState(depth < 2);
  const isOwner = currentUser?.id === comment.user.id;
  const isEdited = comment.updatedAt && comment.updatedAt !== comment.createdAt;
  const hasChildren = comment.children && comment.children.length > 0;
  const maxDepth = 8;
  const indent = Math.min(depth, maxDepth);

  const handleEdit = async () => {
    if (!editText.trim() || isSaving) return;
    setIsSaving(true);
    const prev = comment.text;
    onCommentUpdate(comment._id, editText.trim(), new Date().toISOString());
    setIsEditing(false);
    try {
      const result = await commentApi.update(postId, comment._id, editText.trim());
      onCommentUpdate(comment._id, result.text, result.updatedAt || new Date().toISOString());
    } catch {
      onCommentUpdate(comment._id, prev, comment.updatedAt || comment.createdAt);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await commentApi.remove(postId, comment._id);
      onCommentDelete(comment._id);
    } catch {
      setIsDeleting(false);
    }
  };

  const isReplyOpen = replyTarget === comment._id;

  return (
    <div className={`${isDeleting ? "opacity-30 pointer-events-none" : ""}`}>
      <div className="flex gap-2">
        <div
          className={`flex-shrink-0 overflow-hidden rounded-full border border-dark-500 ${
            depth === 0 ? "h-7 w-7" : "h-6 w-6"
          }`}
        >
          <img
            src={getAvatarUrl(comment.user.avatar, comment.user.username)}
            alt={comment.user.username}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleEdit();
                  }
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="flex-1 rounded-lg border border-dark-600 bg-dark-900 px-3 py-1.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
                autoFocus
              />
              <button
                onClick={handleEdit}
                disabled={!editText.trim() || isSaving}
                className="p-1 text-green-500 hover:text-green-400 disabled:opacity-50"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-dark-400 hover:text-dark-50"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm">
              <span className="font-semibold text-dark-50">
                {comment.user.username}
              </span>{" "}
              <span className="text-dark-200">{comment.text}</span>
              {isEdited && (
                <span className="ml-1 text-[10px] text-dark-500">(edited)</span>
              )}
            </p>
          )}

          {!isEditing && (
            <div className="mt-1 flex items-center gap-3 text-xs text-dark-400">
              <span>{formatDate(comment.createdAt)}</span>
              <button
                onClick={() => onReply(comment._id)}
                className="hover:text-dark-50 flex items-center gap-0.5"
              >
                <MessageCircle size={11} />
                Reply
              </button>
              {isOwner && (
                <>
                  <button onClick={() => { setEditText(comment.text); setIsEditing(true); }} className="hover:text-dark-50">
                    <Pencil size={12} />
                  </button>
                  <button onClick={handleDelete} className="hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          )}

          {isReplyOpen && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmitReply();
                  }
                  if (e.key === "Escape") onCancelReply();
                }}
                className="flex-1 rounded-lg border border-dark-600 bg-dark-900 px-3 py-1.5 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
                autoFocus
              />
              <Button
                size="sm"
                onClick={onSubmitReply}
                disabled={!replyText.trim() || isSubmittingReply}
                isLoading={isSubmittingReply}
              >
                Reply
              </Button>
              <button onClick={onCancelReply} className="text-xs text-dark-400 hover:text-dark-50">
                Cancel
              </button>
            </div>
          )}

          {hasChildren && (
            <div className="mt-2">
              <button
                onClick={() => setShowChildren(!showChildren)}
                className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-50"
              >
                {showChildren ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {comment.children!.length} {comment.children!.length === 1 ? "reply" : "replies"}
              </button>
            </div>
          )}
        </div>
      </div>

      {hasChildren && showChildren && (
        <div
          className={`mt-2 space-y-2 border-l-2 border-dark-600 ${
            indent < maxDepth ? "ml-4 pl-3" : "ml-2 pl-2"
          }`}
        >
          {comment.children!.map((child) => (
            <CommentThread
              key={child._id}
              comment={child}
              postId={postId}
              depth={depth + 1}
              onReply={onReply}
              replyTarget={replyTarget}
              replyText={replyText}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
              isSubmittingReply={isSubmittingReply}
              onCancelReply={onCancelReply}
              onCommentUpdate={onCommentUpdate}
              onCommentDelete={onCommentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
