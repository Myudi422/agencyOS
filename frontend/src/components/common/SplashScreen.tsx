"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useSplashStore } from "@/store/useSplashStore";

export default function SplashScreen() {
  const pathname = usePathname();
  const { isLoading: isAuthLoading } = useAuthStore();
  const { isVisible: isStoreVisible, message: storeMessage } = useSplashStore();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [routeTransitioning, setRouteTransitioning] = useState(false);

  // Initial load auto-hide
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Smooth route transition on pathname change
  useEffect(() => {
    setRouteTransitioning(true);
    const timer = setTimeout(() => {
      setRouteTransitioning(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [pathname]);

  const active = initialLoading || isAuthLoading || isStoreVisible || routeTransitioning;
  
  const displayMessage = 
    isAuthLoading ? "Menghubungkan ke Engine Shiera..." :
    isStoreVisible ? storeMessage :
    "Memuat Shiera Engine...";

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center transition-all duration-300 select-none animate-fadeIn">
      {/* Background Ambient Glow */}
      <div className="absolute w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute w-[250px] h-[250px] bg-indigo-600/15 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-4">
        
        {/* Animated Logo Badge Container */}
        <div className="relative flex items-center justify-center">
          {/* Outer Spinning Gradient Ring */}
          <div className="w-24 h-24 rounded-3xl border-2 border-purple-500/20 border-t-purple-500 border-r-purple-400 animate-spin absolute" />
          
          {/* Outer Pulse Ring */}
          <div className="w-20 h-20 rounded-3xl bg-purple-500/10 animate-ping absolute" />

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
          <p className="text-xs font-semibold text-purple-200/80 tracking-wide font-sans max-w-xs">
            {displayMessage}
          </p>
        </div>

        {/* Progress Bar Track */}
        <div className="w-36 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-purple-500/20 shadow-inner mt-1">
          <div className="h-full bg-gradient-to-r from-purple-500 via-violet-400 to-indigo-500 rounded-full animate-pulse w-full" />
        </div>

      </div>
    </div>
  );
}
