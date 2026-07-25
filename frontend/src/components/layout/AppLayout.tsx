"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PostComposerModal from "@/components/posts/PostComposerModal";
import UploadProgressWidget from "@/components/common/UploadProgressWidget";
import GlassToastManager from "@/components/common/GlassToastManager";
import GlobalGlassConfirmModal from "@/components/common/GlobalGlassConfirmModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
          {children}
        </main>
      </div>
      <PostComposerModal />
      <UploadProgressWidget />
      <GlassToastManager />
      <GlobalGlassConfirmModal />
    </div>
  );
}
