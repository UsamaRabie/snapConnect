"use client";

import { useState } from "react";
import { X, ImagePlus } from "lucide-react";
import type { IPost } from "@/types";
import { Button } from "@/components/common/Button";
import { postApi } from "@/lib/api.service";

interface EditPostModalProps {
  post: IPost;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: IPost) => void;
}

export function EditPostModal({
  post,
  isOpen,
  onClose,
  onUpdate,
}: EditPostModalProps) {
  const [caption, setCaption] = useState(post.caption || "");
  const [location, setLocation] = useState(post.location || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (file) formData.append("image", file);
      formData.append("caption", caption);
      formData.append("location", location);

      const updated = await postApi.update(post._id, formData);
      onUpdate(updated);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-dark-600 bg-dark-800">
        <div className="flex items-center justify-between border-b border-dark-600 px-4 py-3">
          <h2 className="text-lg font-semibold text-dark-50">Edit Post</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-50">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {post.image && (
            <div className="relative">
              <img
                src={preview || post.image}
                alt="Post"
                className="max-h-60 w-full rounded-lg object-contain bg-dark-900"
              />
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dark-600 p-3 text-sm text-dark-400 hover:text-dark-50 hover:border-dark-500">
            <ImagePlus size={18} />
            Change photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <textarea
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-dark-600 bg-dark-900 p-3 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
