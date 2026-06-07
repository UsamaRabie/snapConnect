"use client";

import { useAuthStore } from "@/store/authStore";
import { redirect } from "next/navigation";

export default function MyProfilePage() {
  const { user } = useAuthStore();
  if (user) {
    redirect(`/profile/${user.id}`);
  }
  return null;
}
