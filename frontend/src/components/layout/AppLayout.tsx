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
import SplashScreen from "@/components/common/SplashScreen";

const PUBLIC_PATHS = ["/landing", "/login", "/pricing", "/billing/success", "/onboarding", "/kol-portal", "/review"];

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
    return (
      <>
        <SplashScreen />
        {children}
      </>
    );
  }

  // Show splash screen while auth initializes
  if (isLoading) {
    return <SplashScreen />;
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

