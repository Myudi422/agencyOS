"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function BillingSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan") || "";
  const sessionId = params.get("session_id") || "";
  const { setSubscription } = useAuthStore();

  useEffect(() => {
    const syncAndRefresh = async () => {
      try {
        if (sessionId) {
          // Direct sync with backend
          await fetchApi("/billing/sync-checkout", {
            method: "POST",
            body: JSON.stringify({ session_id: sessionId }),
          });
        }
        // Load the updated subscription status
        const data: any = await fetchApi("/billing/subscription");
        if (data?.subscription) {
          setSubscription(data.subscription);
        }
      } catch (err) {
        console.error("Sync checkout error:", err);
      }
    };
    
    syncAndRefresh();
  }, [sessionId, setSubscription]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
            Pembayaran Berhasil! 🎉
          </h1>
          <p className="text-slate-500 text-sm">
            Paket <strong className="text-purple-700 capitalize">{plan || "kamu"}</strong> sudah aktif.
            Sekarang kamu bisa mulai posting ke semua platform!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Unlimited social accounts sudah aktif</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Post quota telah direset untuk periode baru</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Queue engine siap menerima jadwal posting</span>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 py-3 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        >
          Buka Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
