"use client";

import React from "react";
import { CheckCircle2, ChevronRight, AlertCircle, Plus } from "lucide-react";

export interface AccountItem {
  id: string;
  username: string;
  name: string;
  platform: string;
  avatar_url?: string;
  status: string;
  followers_count: number;
  campaigns_count: number;
  active_campaigns_count: number;
}

interface KolAccountSelectorProps {
  accounts: AccountItem[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string | null) => void;
  loading?: boolean;
}

const PLATFORM_COLORS: Record<string, { bg: string; border: string }> = {
  instagram: { bg: "bg-pink-50 text-pink-700", border: "border-pink-200" },
  tiktok: { bg: "bg-slate-900 text-white", border: "border-slate-800" },
  youtube: { bg: "bg-red-50 text-red-700", border: "border-red-200" },
  facebook: { bg: "bg-blue-50 text-blue-700", border: "border-blue-200" },
  twitter: { bg: "bg-sky-50 text-sky-700", border: "border-sky-200" },
  x: { bg: "bg-slate-900 text-white", border: "border-slate-800" },
  linkedin: { bg: "bg-indigo-50 text-indigo-700", border: "border-indigo-200" },
  pinterest: { bg: "bg-red-50 text-red-700", border: "border-red-200" },
  threads: { bg: "bg-slate-900 text-white", border: "border-slate-800" },
};

export default function KolAccountSelector({
  accounts,
  selectedAccountId,
  onSelectAccount,
  loading = false,
}: KolAccountSelectorProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Pilih Akun Platform ({accounts.length})
        </h3>
      </div>

      {/* Option for All Accounts */}
      <button
        onClick={() => onSelectAccount(null)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all mb-2 ${
          selectedAccountId === null
            ? "border-purple-500 bg-purple-50/80 shadow-xs ring-2 ring-purple-500/20 font-semibold"
            : "border-slate-200 hover:bg-slate-50 text-slate-700"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            🌐
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Semua Akun</p>
            <p className="text-[10px] text-slate-500">Tampilkan seluruh campaign</p>
          </div>
        </div>
        {selectedAccountId === null && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
      </button>

      {loading ? (
        <div className="space-y-2 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-6 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-700">Belum ada akun terhubung</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Hubungkan akun sosmed di Account Manager dahulu.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            const isConnected = acc.status === "connected";
            const platformKey = acc.platform.toLowerCase();
            const platformStyle = PLATFORM_COLORS[platformKey] || { bg: "bg-slate-100 text-slate-700", border: "border-slate-200" };

            return (
              <button
                key={acc.id}
                onClick={() => onSelectAccount(acc.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50/80 shadow-xs ring-2 ring-purple-500/20"
                    : "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {acc.avatar_url ? (
                      <img src={acc.avatar_url} className="w-9 h-9 rounded-xl object-cover border border-slate-200" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200">
                        {acc.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isConnected ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 truncate">@{acc.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${platformStyle.bg}`}>
                        {acc.platform}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {acc.campaigns_count} campaign ({acc.active_campaigns_count} aktif)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
