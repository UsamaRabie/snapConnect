"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-950">
        <Navbar onMenuToggle={() => setSidebarOpen((p) => !p)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="pt-14 lg:pl-56">
          <div className="mx-auto max-w-2xl px-4 py-6 lg:max-w-3xl xl:max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
