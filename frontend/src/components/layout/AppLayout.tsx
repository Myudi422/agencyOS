"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PostComposerModal from "@/components/posts/PostComposerModal";
import UploadProgressWidget from "@/components/common/UploadProgressWidget";
import GlassToastManager from "@/components/common/GlassToastManager";
import GlobalGlassConfirmModal from "@/components/common/GlobalGlassConfirmModal";
import SubscriptionGuard from "@/components/billing/SubscriptionGuard";
import { useAuthStore } from "@/store/authStore";
import AccountSettingsModal from "@/components/profile/AccountSettingsModal";

import ShieraAiReportWidget from "@/components/common/ShieraAiReportWidget";


const PUBLIC_PATHS = ["/landing", "/login", "/pricing", "/billing/success", "/onboarding"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, needsOnboarding, workspaceId } = useAuthStore();

  const isPublicPage = pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));



  // Auth & Onboarding guard
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicPage) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated) {
      if ((needsOnboarding || !workspaceId) && pathname !== "/onboarding") {
        router.replace("/onboarding");
      } else if (!needsOnboarding && workspaceId && pathname === "/onboarding") {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, needsOnboarding, workspaceId, pathname, isPublicPage, router]);

  // Public pages (landing, login, pricing, etc.) rendered without sidebar/header
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Show loading spinner while auth initializes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading Shiera...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileSidebar={() => setIsMobileOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        </main>
      </div>
      <PostComposerModal />
      <AccountSettingsModal />
      <UploadProgressWidget />
      <GlassToastManager />
      <GlobalGlassConfirmModal />
      <ShieraAiReportWidget />
    </div>
  );
}

