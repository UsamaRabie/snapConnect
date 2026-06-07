"use client";

import { useRouter } from "next/navigation";
import { CreatePost } from "@/components/post/CreatePost";

export default function CreatePage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg">
      <CreatePost
        onSuccess={() => router.push("/feed")}
        onClose={() => router.push("/feed")}
      />
    </div>
  );
}
