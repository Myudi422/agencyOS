"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { CreditCard, Zap, Rocket, Crown, Building2, ChevronRight, AlertTriangle, Lock } from "lucide-react";

const TIER_META: Record<string, { name: string; price: string; posts: string; Icon: any; color: string }> = {
  trial: { name: "Starter Trial", price: "Rp 0/3hari", posts: "6 posts", Icon: Zap, color: "text-slate-600" },
  creator: { name: "Creator", price: "Rp 49rb/bln", posts: "50 posts", Icon: Rocket, color: "text-blue-600" },
  agency: { name: "Agency", price: "Rp 299rb/bln", posts: "300 posts", Icon: Crown, color: "text-purple-600" },
  studio: { name: "Studio", price: "Rp 749rb/bln", posts: "1.000 posts", Icon: Building2, color: "text-amber-600" },
};

/**
 * SubscriptionGuard — overlays and locks the app when user has no active subscription,
 * when subscription is expired, or when post quota is exhausted.
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

  // Subscription evaluation
  const isExpired = !subscription || subscription.is_expired || subscription.status === "expired" || subscription.status === "cancelled";
  const isQuotaExhausted = subscription ? (subscription.posts_remaining <= 0 || (subscription.posts_limit > 0 && subscription.posts_used >= subscription.posts_limit)) : false;
  const hasActiveSub = subscription && !isExpired && !isQuotaExhausted && (subscription.status === "active" || subscription.status === "trial");

  // User has active subscription and available quota → allow access
  if (hasActiveSub) return <>{children}</>;

  // Determine block reason for user guidance
  let blockTitle = "Pilih Paket Untuk Mulai";
  let blockMessage = "Kamu belum memiliki paket aktif. Silakan pilih paket untuk menikmati akses penuh.";
  let badgeText = "Akses Terkunci";

  if (isQuotaExhausted) {
    blockTitle = "Kuota Posting Telah Habis ⚠️";
    blockMessage = `Kamu telah menggunakan ${subscription?.posts_used ?? 0} dari ${subscription?.posts_limit ?? 0} posting. Silakan perpanjang atau upgrade paket untuk menambah kuota.`;
    badgeText = "Kuota 0 Remaining";
  } else if (isExpired) {
    blockTitle = "Masa Langganan Telah Berakhir ⌛";
    blockMessage = "Paket langganan kamu sudah kedaluwarsa. Silakan perpanjang paket untuk melanjutkan akses ke Shiera.";
    badgeText = "Langganan Expired";
  }

  // Locked overlay block
  return (
    <div className="relative">
      {/* Blurred background — strictly non-interactive */}
      <div className="pointer-events-none select-none blur-md opacity-25 overflow-hidden max-h-screen">
        {children}
      </div>

      {/* Full-screen blocking modal overlay */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold tracking-wider text-purple-200 border border-white/20 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>{badgeText}</span>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
              {isQuotaExhausted ? (
                <AlertTriangle className="w-7 h-7 text-amber-300" />
              ) : (
                <CreditCard className="w-7 h-7 text-purple-200" />
              )}
            </div>
            <h2 className="text-xl font-extrabold font-['Outfit']">{blockTitle}</h2>
            <p className="text-xs text-purple-200 mt-1.5 leading-relaxed max-w-md mx-auto">
              {blockMessage}
            </p>
          </div>

          {/* Subscription Tier List */}
          <div className="p-5 space-y-2 bg-slate-50/50">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Pilih Paket Langganan Baru:
            </p>
            {Object.entries(TIER_META).map(([tier, meta]) => {
              const Icon = meta.Icon;
              return (
                <button
                  key={tier}
                  type="button"
                  id={`sub-guard-plan-${tier}`}
                  onClick={() => router.push("/pricing")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/60 shadow-2xs hover:shadow-sm transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center ${meta.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">{meta.name}</p>
                      <p className="text-[10px] text-slate-500">{meta.posts} · Unlimited sosial akun</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">{meta.price}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Modal Actions */}
          <div className="px-5 pb-5 pt-2 bg-white flex flex-col gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push("/pricing")}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bayar & Perpanjang Sekarang (Midtrans)</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
            >
              Keluar dari Akun
            </button>

            <p className="text-center text-[10px] text-slate-400 mt-0.5">
              🔒 Pembayaran aman via Midtrans (QRIS, GoPay, ShopeePay, Virtual Account, Credit Card)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

