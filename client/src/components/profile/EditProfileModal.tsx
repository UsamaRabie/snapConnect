"use client";

import { useState, useRef, type FormEvent } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, X, Loader2 } from "lucide-react";
import type { IUser } from "@/types";
import { userApi } from "@/lib/api.service";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";

interface EditProfileModalProps {
  user: IUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: IUser) => void;
}

export function EditProfileModal({
  user,
  isOpen,
  onClose,
  onUpdate,
}: EditProfileModalProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(user.bio || "");
  const [username, setUsername] = useState(user.username);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const checkUsername = async (val: string) => {
    if (val === user.username) {
      setUsernameAvailable(null);
      return;
    }
    try {
      const result = await userApi.checkUsername(val);
      setUsernameAvailable(result.available);
    } catch {
      setUsernameAvailable(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("avatar");
    setAvatarPreview(URL.createObjectURL(file));
    try {
      const updated = await userApi.uploadAvatar(file);
      onUpdate(updated);
    } catch (err: any) {
      setError(err.message);
      setAvatarPreview(null);
    } finally {
      setUploading(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    setCoverPreview(URL.createObjectURL(file));
    try {
      const updated = await userApi.uploadCoverImage(file);
      onUpdate(updated);
    } catch (err: any) {
      setError(err.message);
      setCoverPreview(null);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const updated = await userApi.updateProfile({ fullName, bio, username });
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-300">
            Cover Image
          </label>
          <div className="relative h-28 w-full overflow-hidden rounded-lg bg-dark-900">
            <img
              src={
                coverPreview ||
                user.coverImage ||
                "https://via.placeholder.com/600x150/1e293b/475569?text="
              }
              alt="Cover"
              className="h-full w-full object-cover"
            />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === "cover"}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
            >
              {uploading === "cover" ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : (
                <Camera size={24} className="text-white" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-center -mt-10 relative z-10">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-dark-800 bg-dark-900">
              <img
                src={avatarPreview || user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=0ea5e9&color=fff`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading === "avatar"}
              className="absolute bottom-0 right-0 rounded-full bg-primary-500 p-1.5 text-white hover:bg-primary-600 transition-colors"
            >
              {uploading === "avatar" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
          </div>
        </div>

        <Input
          id="ef-fullName"
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={50}
          required
        />

        <div>
          <Input
            id="ef-username"
            label="Username"
            value={username}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
              setUsername(val);
              setUsernameAvailable(null);
            }}
            onBlur={() => checkUsername(username)}
            maxLength={30}
            required
          />
          {usernameAvailable === true && (
            <p className="mt-1 text-xs text-green-500">Username available</p>
          )}
          {usernameAvailable === false && (
            <p className="mt-1 text-xs text-red-400">Username is taken</p>
          )}
        </div>

        <div>
          <label
            htmlFor="ef-bio"
            className="mb-1.5 block text-sm font-medium text-dark-300"
          >
            Bio
          </label>
          <textarea
            id="ef-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            rows={3}
            className="w-full resize-none rounded-lg border border-dark-600 bg-dark-900 px-3 py-2.5 text-sm text-dark-50 placeholder-dark-400 transition-colors focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            placeholder="Tell people about yourself"
          />
          <p className="mt-1 text-right text-xs text-dark-500">
            {bio.length}/150
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
