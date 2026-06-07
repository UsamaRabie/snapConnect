"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Grid, Bookmark, Tag, MessageCircle } from "lucide-react";
import type { IUserProfile, IPost, IUser } from "@/types";
import { userApi, postApi, conversationApi } from "@/lib/api.service";
import { useAuthStore } from "@/store/authStore";
import { PostGrid } from "@/components/post/PostGrid";
import { SavedPostsGrid } from "@/components/post/SavedPostsGrid";
import { TaggedPostsGrid } from "@/components/post/TaggedPostsGrid";
import { Button } from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { FollowButton } from "@/components/follow/FollowButton";
import { FollowersModal } from "@/components/follow/FollowersModal";
import { FollowingModal } from "@/components/follow/FollowingModal";
import { formatCount, getAvatarUrl } from "@/lib/utils";

type Tab = "posts" | "saved" | "tagged";

export default function ProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, setUser } = useAuthStore();

  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [userData, userPosts] = await Promise.all([
          userApi.getProfile(id),
          postApi.getUserPosts(id),
        ]);
        setProfile(userData);
        setPosts(userPosts.posts);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleProfileUpdate = (updated: IUser) => {
    setProfile((p) => (p ? { ...p, ...updated } : p));
    if (isOwnProfile) setUser(updated);
  };

  const handleFollowUpdate = (_userId: string, nowFollowing: boolean) => {
    setProfile((p) =>
      p
        ? {
            ...p,
            isFollowing: nowFollowing,
            followersCount: p.followersCount + (nowFollowing ? 1 : -1),
          }
        : p
    );
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dark-600 bg-dark-800 p-12">
        <p className="text-lg text-dark-400">User not found</p>
        <Link href="/feed" className="text-sm text-primary-500 hover:underline">
          Go back to feed
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-16 overflow-hidden rounded-xl border border-dark-600 bg-dark-800">
        <div className="relative h-36 sm:h-48 bg-gradient-to-r from-dark-700 via-dark-800 to-dark-700">
          {profile.coverImage && (
            <img
              src={profile.coverImage}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="relative px-4 pb-4">
          <div className="flex -mt-12 items-end gap-4">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-dark-800 bg-dark-900">
              <img
                src={getAvatarUrl(profile.avatar, profile.username)}
                alt={profile.username}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-1 items-start justify-between pt-10">
              <div>
                <h1 className="text-xl font-bold text-dark-50">
                  {profile.fullName}
                </h1>
                <p className="text-sm text-dark-400">@{profile.username}</p>
              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Settings size={16} className="mr-1.5" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <FollowButton
                      userId={id}
                      isFollowing={profile.isFollowing}
                      onFollow={handleFollowUpdate}
                    />
                    <button
                      onClick={async () => {
                        try {
                          const conv = await conversationApi.getOrCreate(id);
                          router.push(`/messages?conversation=${conv._id}`);
                        } catch {}
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-dark-600 px-3 py-1.5 text-sm text-dark-200 hover:bg-dark-700 hover:text-dark-50 transition-colors"
                    >
                      <MessageCircle size={16} />
                      Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm text-dark-200">{profile.bio}</p>
          )}

          <div className="mt-4 flex gap-8">
            <div className="text-center">
              <p className="text-lg font-bold text-dark-50">
                {formatCount(profile.postsCount || posts.length)}
              </p>
              <p className="text-xs text-dark-400">posts</p>
            </div>
            <button
              onClick={() => setShowFollowers(true)}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="text-lg font-bold text-dark-50">
                {formatCount(profile.followersCount)}
              </p>
              <p className="text-xs text-dark-400">followers</p>
            </button>
            <button
              onClick={() => setShowFollowing(true)}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="text-lg font-bold text-dark-50">
                {formatCount(profile.followingCount)}
              </p>
              <p className="text-xs text-dark-400">following</p>
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 border-b border-dark-600">
        <div className="flex">
          {(
            [
              { key: "posts", label: "Posts", icon: Grid },
              { key: "saved", label: "Saved", icon: Bookmark },
              { key: "tagged", label: "Tagged", icon: Tag },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 border-t-2 px-4 py-3 text-xs font-semibold uppercase transition-colors ${
                activeTab === key
                  ? "border-white text-dark-50"
                  : "border-transparent text-dark-400 hover:text-dark-200"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "posts" && <PostGrid posts={posts} />}
      {activeTab === "saved" && <SavedPostsGrid />}
{activeTab === "tagged" && <TaggedPostsGrid userId={id} />}

      {showEditModal && profile && (
        <EditProfileModal
          user={profile}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      <FollowersModal
        userId={id}
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
      />

      <FollowingModal
        userId={id}
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
      />
    </div>
  );
}
