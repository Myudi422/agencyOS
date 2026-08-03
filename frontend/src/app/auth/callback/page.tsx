"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { fetchApi } from "@/lib/api";

function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeWorkspace, clients } = useStore();
  const { workspaceId: authWorkspaceId } = useAuthStore();

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Menghubungkan akun media sosial kamu...");
  const hasCalledRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const accountId = searchParams.get("account_id") || searchParams.get("social_account_id");
    const platform = searchParams.get("platform");
    const callbackStatus = searchParams.get("status");

    // Resolve active workspace ID with robust fallbacks
    const storedWsId = typeof window !== "undefined" ? localStorage.getItem("agencyos_active_ws_id") : null;
    const targetWsId = activeWorkspace?.id || authWorkspaceId || storedWsId;

    // PostForMe returns "External Id already exists for account spc_...|No valid accounts found" in the error query param.
    // We check full error string to handle spaces, underscores, and message variants cleanly.
    const fullErrorStr = `${error || ""} ${errorDescription || ""}`.toLowerCase();
    const isExternalIdConflict = (
      fullErrorStr.includes("external id") ||
      fullErrorStr.includes("external_id") ||
      fullErrorStr.includes("already exists") ||
      fullErrorStr.includes("no valid accounts found")
    );

    if (error && !isExternalIdConflict) {
      // Only show hard error for non-recoverable OAuth failures
      setStatus("error");
      setMessage(`OAuth Error: ${errorDescription || error}`);
      return;
    }

    // If it's an external_id conflict, log it but continue to sync
    if (isExternalIdConflict) {
      console.warn("[OAuth] external_id conflict detected — proceeding to sync instead:", errorDescription);
    }

    // Prevent double execution in React 19 StrictMode
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    const processCallback = async () => {
      try {
        // Detect if this is a PostForMe OAuth callback:
        // PostForMe redirects back with social_account_id/platform/status — NOT a Meta code.
        const isPostForMeCallback = !!(accountId || platform || callbackStatus || isExternalIdConflict);

        // 1. Direct Meta OAuth code flow (only if code present AND this is NOT a PostForMe redirect)
        if (code && !isPostForMeCallback) {
          setMessage("Memproses Meta OAuth code...");
          let callbackUrl = `/auth/meta/callback?code=${encodeURIComponent(code)}`;
          if (targetWsId) callbackUrl += `&workspace_id=${targetWsId}`;
          if (clients[0]?.id) callbackUrl += `&client_id=${clients[0].id}`;

          await fetchApi<any>(callbackUrl, { method: "POST" });
        }

        // 2. PostForMe OAuth callback flow → sync accounts into DB
        setMessage("Menyinkronkan akun media sosial...");
        await fetchApi<any>("/auth/postforme/sync-accounts", {
          method: "POST",
          body: JSON.stringify({
            workspace_id: targetWsId,
            client_id: clients[0]?.id
          })
        });

        setStatus("success");
        setMessage("Akun media sosial berhasil terhubung!");
        setTimeout(() => {
          router.push("/accounts");
        }, 1500);

      } catch (err: any) {
        console.error("OAuth callback sync error:", err);
        // Graceful fallback — PostForMe might have connected the account even if sync fails
        const accountId = searchParams.get("account_id") || searchParams.get("social_account_id");
        const platform = searchParams.get("platform");
        const callbackStatus = searchParams.get("status");
        if (accountId || callbackStatus === "connected" || platform || isExternalIdConflict) {
          setStatus("success");
          setMessage("Koneksi saluran sosial selesai! Periksa halaman Accounts.");
          setTimeout(() => {
            router.push("/accounts");
          }, 1500);
        } else {
          setStatus("error");
          setMessage(err.message || "Gagal mengonfirmasi koneksi akun sosial.");
        }
      }
    };

    processCallback();
  }, [searchParams, activeWorkspace?.id, clients, router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-[#0f111a] border border-border rounded-2xl p-8 max-w-md w-full space-y-4 shadow-2xl glass-card">
        {status === "processing" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-base font-bold text-white font-['Outfit']">Menghubungkan Akun Media Sosial</h2>
            <p className="text-xs text-gray-400">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-emerald-400 font-['Outfit']">Koneksi Berhasil!</h2>
            <p className="text-xs text-gray-300">{message}</p>
            <p className="text-[10px] text-gray-500">Mengalihkan ke Account Manager...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-pink-400 font-['Outfit']">Gagal Menghubungkan OAuth</h2>
            <p className="text-xs text-gray-400 leading-relaxed">{message}</p>
            <button
              onClick={() => router.push("/accounts")}
              className="py-2 px-4 rounded-xl gradient-brand text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 mt-2"
            >
              Kembali ke Account Manager
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Memuat koneksi OAuth...</div>}>
      <OAuthCallbackHandler />
    </Suspense>
  );
}
