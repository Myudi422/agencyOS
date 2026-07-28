"use client";

import React, { useState } from "react";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { X, CreditCard, ShieldCheck, Mail, User, BarChart, Sparkles, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function AccountSettingsModal() {
  const { isSettingsOpen, closeSettings } = useStore();
  const { user, subscription, isAdmin } = useAuthStore();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  const handleOpenStripePortal = () => {
    closeSettings();
    window.location.href = "/pricing";
  };

  const usagePercent = subscription
    ? Math.min(100, Math.round((subscription.posts_used / subscription.posts_limit) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base font-['Outfit']">Pengaturan Akun & Langganan</h2>
              <p className="text-[10px] text-slate-400 font-medium">Ubah profil dan kelola billing kartu kredit</p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Profil</h3>
            <div className="flex items-center gap-4">
              {user?.avatar_url ? (
                <img src={user.avatar_url} className="w-12 h-12 rounded-full border border-slate-200 object-cover" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  {user?.full_name || "User"}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user?.email || "No Email"}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Langganan</h3>
            {subscription ? (
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                {/* Plan Tier */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 capitalize flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      {subscription.plan_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {subscription.is_expired
                        ? "Masa aktif paket Anda telah berakhir"
                        : subscription.expires_at
                        ? `Aktif hingga ${new Date(subscription.expires_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}`
                        : "Paket lifetime (Admin)"}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${
                    subscription.is_expired
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {subscription.is_expired ? "Expired" : subscription.status}
                  </span>
                </div>

                {/* Quota Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <BarChart className="w-3.5 h-3.5 text-slate-400" />
                      Kuota Postingan Terpakai
                    </span>
                    <span className="font-bold text-slate-800">
                      {subscription.posts_used} / {subscription.posts_limit}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usagePercent >= 90
                          ? "bg-gradient-to-r from-red-500 to-rose-600"
                          : "bg-gradient-to-r from-purple-500 to-violet-600"
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{usagePercent}% terpakai</span>
                    <span>Sisa posting: {subscription.posts_remaining}</span>
                  </div>
                </div>

                {/* Stripe Portal CTA */}
                <button
                  onClick={handleOpenStripePortal}
                  disabled={loadingPortal}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-xs shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {loadingPortal ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menghubungkan ke Stripe...</span>
                    </>
                  ) : (
                    <span>Kelola / Upgrade Paket (Midtrans)</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 border-dashed rounded-2xl p-6 text-center space-y-3">
                <p className="text-xs text-slate-500">Anda belum berlangganan paket apa pun.</p>
                <button
                  onClick={() => {
                    closeSettings();
                    window.location.href = "/pricing";
                  }}
                  className="inline-flex items-center gap-1 py-2 px-4 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold text-xs transition-colors"
                >
                  Mulai Berlangganan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={closeSettings}
            className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
