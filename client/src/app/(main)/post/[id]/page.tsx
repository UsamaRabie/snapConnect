"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { IPost } from "@/types";
import { postApi } from "@/lib/api.service";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { LikeButton } from "@/components/like/LikeButton";
import { LikedByModal } from "@/components/like/LikedByModal";
import { CommentSection } from "@/components/comment/CommentSection";
import { EditPostModal } from "@/components/post/EditPostModal";
import { useLike } from "@/hooks/useLikes";
import { formatDate, formatCount, getAvatarUrl } from "@/lib/utils";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [post, setPost] = useState<IPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await postApi.getById(id);
        setPost(data);
        setCommentsCount(data.commentsCount);
        setIsSaved(!!data.isSaved);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const { isLiked, likesCount, toggleLike } = useLike(
    id,
    post?.isLiked ?? false,
    post?.likesCount ?? 0
  );

  const handleDelete = async () => {
    if (!post) return;
    setShowDeleteConfirm(false);
    try {
      await postApi.delete(post._id);
      router.push("/feed");
    } catch {}
  };

  const handleUpdate = (updated: IPost) => {
    setPost(updated);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (!post) {
    return (
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-8 text-center">
        <p className="text-dark-400">Post not found</p>
        <Link href="/feed" className="mt-4 text-primary-500 hover:underline inline-block">
          Go back to feed
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === post.user.id;

  return (
    <div className="mx-auto max-w-lg lg:max-w-xl">
      <Link
        href="/feed"
        className="mb-4 flex items-center gap-2 text-sm text-dark-400 hover:text-dark-50 w-fit"
      >
        <ArrowLeft size={18} />
        Back
      </Link>

      <article className="rounded-xl border border-dark-600 bg-dark-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-dark-500">
              <img
                src={getAvatarUrl(post.user.avatar, post.user.username)}
                alt={post.user.username}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <Link
                href={`/profile/${post.user.id}`}
                className="text-sm font-semibold text-dark-50 hover:underline"
              >
                {post.user.username}
              </Link>
              {post.location && (
                <p className="text-xs text-dark-400">{post.location}</p>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-dark-400 hover:text-dark-50"
              >
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-dark-600 bg-dark-800 shadow-lg z-10">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowEditModal(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-dark-50 hover:bg-dark-700"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-dark-700"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {post.image && (
          <div className="bg-dark-900">
            <img
              src={post.image}
              alt={post.caption || "Post"}
              className="w-full object-contain max-h-[70vh]"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LikeButton
                isLiked={isLiked}
                likesCount={0}
                onLike={toggleLike}
                showCount={false}
              />
              <button
                onClick={() => setShowComments(!showComments)}
                className="transition-colors hover:text-primary-500"
              >
                <MessageCircle size={22} className="text-dark-50" />
              </button>
            </div>
            <button
              onClick={async () => {
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
                  setIsSaved(!!post?.isSaved);
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="text-dark-400 hover:text-dark-50"
            >
              <Bookmark size={22} className={isSaved ? "fill-dark-50" : ""} />
            </button>
          </div>

          <LikeButton
            isLiked={isLiked}
            likesCount={likesCount}
            onLike={toggleLike}
            onCountClick={() => setShowLikes(true)}
          />

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

          {post.tags && post.tags.length > 0 && (
            <p className="text-sm text-primary-500">
              {post.tags.map((tag) => `#${tag}`).join(" ")}
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

          <button
            onClick={() => setShowComments(!showComments)}
            className="text-xs text-dark-400 hover:text-dark-300"
          >
            View all {formatCount(commentsCount)} comments
          </button>

          <p className="text-[10px] uppercase text-dark-500">
            {formatDate(post.createdAt)}
          </p>
        </div>

        {showComments && (
          <div className="border-t border-dark-600 p-4">
            <CommentSection postId={post._id} onCommentsCountChange={(delta) => setCommentsCount((c) => c + delta)} />
          </div>
        )}
      </article>

      <LikedByModal
        postId={post._id}
        isOpen={showLikes}
        onClose={() => setShowLikes(false)}
      />

      {showEditModal && (
        <EditPostModal
          post={post}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
        />
      )}

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
    </div>
  );
}
