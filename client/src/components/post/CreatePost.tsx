"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, ImagePlus } from "lucide-react";
import type { IUser } from "@/types";
import { Button } from "@/components/common/Button";
import { postApi } from "@/lib/api.service";
import { TagPeople } from "./TagPeople";

interface CreatePostProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function CreatePost({ onSuccess, onClose }: CreatePostProps) {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<IUser[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".gif", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      if (caption) formData.append("caption", caption);
      if (location) formData.append("location", location);
      taggedUsers.forEach((u) => formData.append("taggedUsers", u.id));

      await postApi.create(formData);
      setCaption("");
      setLocation("");
      setFile(null);
      setPreview(null);
      setTaggedUsers([]);
      onSuccess?.();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-dark-600 bg-dark-800 p-4">
      <h2 className="mb-4 text-lg font-semibold text-dark-50">Create Post</h2>

      {!preview ? (
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragActive
              ? "border-primary-500 bg-primary-500/10"
              : "border-dark-600 hover:border-dark-500"
          }`}
        >
          <input {...getInputProps()} />
          <ImagePlus size={40} className="mb-2 text-dark-400" />
          <p className="text-sm text-dark-400">
            Drag & drop or click to upload
          </p>
        </div>
      ) : (
        <div className="relative mb-4">
          <img
            src={preview}
            alt="Preview"
            className="max-h-80 w-full rounded-lg object-contain bg-dark-900"
          />
          <button
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
            className="absolute top-2 right-2 rounded-full bg-dark-900/80 p-1 text-dark-50"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="space-y-3">
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-dark-600 bg-dark-900 p-3 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
        />
        <input
          type="text"
          placeholder="Add location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
        />
        <TagPeople selected={taggedUsers} onChange={setTaggedUsers} />
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!file || isUploading}
            isLoading={isUploading}
            className="flex-1"
          >
            Share
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
