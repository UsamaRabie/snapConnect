"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Bookmark, Trash2 } from "lucide-react";
import type { IPost } from "@/types";
import { formatDate, formatCount, getAvatarUrl } from "@/lib/utils";
import { LikeButton } from "@/components/like/LikeButton";
import { LikedByModal } from "@/components/like/LikedByModal";
import { FeedComments } from "@/components/comment/FeedComments";
import { postApi } from "@/lib/api.service";
import { useLike } from "@/hooks/useLikes";
import { useAuthStore } from "@/store/authStore";

interface PostCardProps {
  post: IPost;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { user: currentUser } = useAuthStore();
  const [showLikes, setShowLikes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(!!post.isSaved);
  const [isSaving, setIsSaving] = useState(false);
  const { isLiked, likesCount, toggleLike } = useLike(
    post._id,
    !!post.isLiked,
    post.likesCount
  );

  const isOwner = currentUser?.id === post.user.id;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await postApi.unsave(post._id);
        setIsSaved(false);
      } else {
        await postApi.save(post._id);
        setIsSaved(true);
      }
    } catch {
      setIsSaved(!!post.isSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.(post._id);
  };

  return (
    <>
      <article className="rounded-xl border border-dark-600 bg-dark-800">
        <div className="flex items-center justify-between p-3">
          <Link
            href={`/profile/${post.user.id}`}
            className="flex items-center gap-3"
          >
            <div className="h-8 w-8 overflow-hidden rounded-full border border-dark-500">
              <img
                src={getAvatarUrl(post.user.avatar, post.user.username)}
                alt={post.user.username}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark-50">
                {post.user.username}
              </p>
              {post.location && (
                <p className="text-xs text-dark-400">{post.location}</p>
              )}
            </div>
          </Link>
          {isOwner && onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 text-dark-400 hover:text-red-500"
              title="Delete post"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {post.image && (
          <div className="aspect-square w-full overflow-hidden bg-dark-900">
            <img
              src={post.image}
              alt={post.caption || "Post image"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LikeButton
                isLiked={isLiked}
                likesCount={0}
                onLike={toggleLike}
                showCount={false}
              />
              <button onClick={() => setShowComments(!showComments)}>
                <MessageCircle size={22} className="text-dark-50 hover:text-dark-300" />
              </button>
            </div>
            <button onClick={handleSave} disabled={isSaving} className="text-dark-400 hover:text-dark-50">
              <Bookmark size={22} className={isSaved ? "fill-dark-50" : ""} />
            </button>
          </div>

          <button
            onClick={() => setShowLikes(true)}
            className="text-sm font-semibold text-dark-50 hover:underline"
          >
            {formatCount(likesCount)} likes
          </button>

          {post.caption && (
            <p className="text-sm text-dark-200">
              <Link
                href={`/profile/${post.user.id}`}
                className="font-semibold text-dark-50 hover:underline"
              >
                {post.user.username}
              </Link>{" "}
              {post.caption}
            </p>
          )}

          {post.taggedUsers && post.taggedUsers.length > 0 && (
            <p className="text-xs text-primary-500">
              with{" "}
              {post.taggedUsers.map((u, i) => (
                <span key={u.id}>
                  {i > 0 && ", "}
                  <Link href={`/profile/${u.id}`} className="hover:underline">
                    @{u.username}
                  </Link>
                </span>
              ))}
            </p>
          )}

          {showComments && (
            <FeedComments postId={post._id} commentsCount={post.commentsCount} />
          )}

          <p className="text-[10px] uppercase text-dark-500">
            {formatDate(post.createdAt)}
          </p>
        </div>
      </article>

      <LikedByModal
        postId={post._id}
        isOpen={showLikes}
        onClose={() => setShowLikes(false)}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-dark-600 bg-dark-800 p-6 text-center shadow-xl">
            <p className="mb-2 text-lg font-semibold text-dark-50">Delete post?</p>
            <p className="mb-6 text-sm text-dark-400">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-dark-600 px-4 py-2 text-sm text-dark-50 hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
