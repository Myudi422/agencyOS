"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { CreditCard, Zap, Rocket, Crown, Building2, ChevronRight } from "lucide-react";

const TIER_META: Record<string, { name: string; price: string; posts: string; Icon: any; color: string }> = {
  trial: { name: "Starter Trial", price: "Rp 0/3hari", posts: "6 posts", Icon: Zap, color: "text-slate-600" },
  creator: { name: "Creator", price: "Rp 49rb/bln", posts: "50 posts", Icon: Rocket, color: "text-blue-600" },
  agency: { name: "Agency", price: "Rp 299rb/bln", posts: "300 posts", Icon: Crown, color: "text-purple-600" },
  studio: { name: "Studio", price: "Rp 749rb/bln", posts: "1.000 posts", Icon: Building2, color: "text-amber-600" },
};

/**
 * SubscriptionGuard — overlays the app when user has no active subscription.
 * Admin users bypass this guard entirely.
 */
export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin, subscription, isAuthenticated, isLoading, logout } = useAuthStore();

  const handleLogout = async () => {
    const { signOut } = await import("@/lib/auth");
    await signOut();
    logout();
    router.replace("/login");
  };

  // Still loading auth
  if (isLoading) return <>{children}</>;

  // Not logged in — handled by AppLayout auth redirect
  if (!isAuthenticated) return <>{children}</>;

  // Admin bypasses all guards
  if (isAdmin) return <>{children}</>;

  // User has valid subscription → show app
  const hasActiveSub =
    subscription &&
    !subscription.is_expired &&
    (subscription.status === "active" || subscription.status === "trial");

  if (hasActiveSub) return <>{children}</>;

  // No active subscription — show pricing overlay
  return (
    <div className="relative">
      {/* Blurred background */}
      <div className="pointer-events-none select-none blur-sm opacity-30 overflow-hidden max-h-screen">
        {children}
      </div>

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 to-violet-700 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-['Outfit']">Pilih Paket Untuk Mulai</h2>
            <p className="text-sm text-purple-200 mt-1">
              {subscription?.is_expired
                ? "Paket kamu sudah habis. Perpanjang untuk lanjut posting."
                : "Kamu belum punya paket aktif. Pilih paket untuk akses penuh."}
            </p>
          </div>

          {/* Plans mini-list */}
          <div className="p-5 space-y-2">
            {Object.entries(TIER_META).map(([tier, meta]) => {
              const Icon = meta.Icon;
              return (
                <button
                  key={tier}
                  id={`sub-guard-plan-${tier}`}
                  onClick={() => router.push("/pricing")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">{meta.name}</p>
                      <p className="text-xs text-slate-400">{meta.posts} · Unlimited akun sosmed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{meta.price}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-5 pb-5 flex flex-col gap-2">
            <button
              onClick={() => router.push("/pricing")}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              Lihat Semua Paket & Mulai Berlangganan
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all hover:scale-[1.01]"
            >
              Keluar dari Akun
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-1">
              🇮🇩 Midtrans Sandbox Payment Gateway (QRIS, GoPay, ShopeePay, Virtual Account, Credit Card)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
