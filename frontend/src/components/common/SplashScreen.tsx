"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useSplashStore } from "@/store/useSplashStore";

const PUBLIC_SPLASH_PATHS = ["/", "/landing", "/login"];

export default function SplashScreen() {
  const pathname = usePathname();
  const { isLoading: isAuthLoading } = useAuthStore();
  const { isVisible: isStoreVisible, message: storeMessage } = useSplashStore();
  
  // SplashScreen only shows when explicitly triggered by store (e.g. login/logout) or during auth loading on protected pages.
  // Public pages (landing page `/`, `/pricing`, `/login`) display instantly without a loading screen delay.
  const isPublicPage = pathname === "/" || PUBLIC_SPLASH_PATHS.some((p) => pathname.startsWith(p));
  
  const active = isStoreVisible || (!isPublicPage && isAuthLoading);
  
  const displayMessage = 
    isStoreVisible ? storeMessage :
    isAuthLoading ? "Menghubungkan ke Engine Shiera..." :
    "Memuat Shiera Engine...";

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center transition-all duration-500 select-none animate-fadeIn">
      {/* Background Ambient Glow */}
      <div className="absolute w-[420px] h-[420px] bg-purple-600/25 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute w-[280px] h-[280px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-4">
        
        {/* Animated Logo Badge Container */}
        <div className="relative flex items-center justify-center">
          {/* Outer Spinning Gradient Ring */}
          <div className="w-24 h-24 rounded-3xl border-2 border-purple-500/30 border-t-purple-500 border-r-purple-400 animate-spin absolute" />
          
          {/* Outer Pulse Ring */}
          <div className="w-20 h-20 rounded-3xl bg-purple-500/15 animate-ping absolute" />

          {/* Central Rounded Logo Badge with 3D Flip/Spin Effect */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-600 p-3.5 shadow-2xl shadow-purple-500/50 flex items-center justify-center animate-logo-pulse-glow relative z-10 border border-purple-400/30">
            <img 
              src="/logo.png" 
              alt="Shiera Logo" 
              className="w-full h-full object-contain brightness-0 invert animate-logo-spin-3d" 
            />
          </div>
        </div>

        {/* Brand Text & Status */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-['Outfit'] flex items-center justify-center gap-1">
            Shiera<span className="text-purple-400 animate-pulse">.</span>
          </h2>
          <p className="text-xs font-semibold text-purple-200/90 tracking-wide font-sans max-w-xs">
            {displayMessage}
          </p>
        </div>

        {/* Progress Bar Track */}
        <div className="w-40 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-purple-500/20 shadow-inner mt-1">
          <div className="h-full bg-gradient-to-r from-purple-500 via-violet-400 to-indigo-500 rounded-full animate-pulse w-full" />
        </div>

      </div>
    </div>
  );
}
