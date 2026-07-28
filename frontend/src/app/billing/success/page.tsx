"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle2, ArrowRight, Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api";

function BillingSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan") || "";
  const orderId = params.get("order_id") || params.get("session_id") || "";
  const { setSubscription } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [synced, setSynced] = useState(false);

  const syncSubscription = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (orderId) {
        // 1. Sync checkout with Midtrans order_id
        await fetchApi("/billing/sync-checkout", {
          method: "POST",
          body: JSON.stringify({ order_id: orderId }),
        });
      }

      // 2. Refresh subscription status from backend
      const data: any = await fetchApi("/billing/subscription");
      if (data?.subscription) {
        setSubscription(data.subscription);
      }
      setSynced(true);
    } catch (err: any) {
      console.error("Sync checkout error:", err);
      setErrorMsg(err.message || "Gagal mengonfirmasi status pembayaran dari Midtrans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncSubscription();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        {loading ? (
          <div className="p-8 rounded-3xl bg-white shadow-xl space-y-4 border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-['Outfit']">Memverifikasi Pembayaran...</h2>
            <p className="text-xs text-slate-500">
              Menghubungkan ke sistem Midtrans untuk mengaktifkan paket kamu. Mohon tunggu...
            </p>
          </div>
        ) : errorMsg ? (
          <div className="p-8 rounded-3xl bg-white shadow-xl space-y-5 border border-red-100 text-left">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">Verifikasi Tertunda</h2>
              <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={syncSubscription}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-purple-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Cek Lagi</span>
              </button>
              <button
                onClick={() => router.push("/")}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Ke Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
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
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-xs text-slate-400 font-medium">Memuat konfirmasi pembayaran...</p>
        </div>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
