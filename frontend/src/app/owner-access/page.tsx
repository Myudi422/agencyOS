"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";
import { ShieldCheck, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";

export default function OwnerAccessPage() {
  const router = useRouter();
  const { setUser, setSubscription, setWorkspaceId, setNeedsOnboarding, setLoading, setIdToken } = useAuthStore();
  const { setWorkspaces, setActiveWorkspace } = useStore();

  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoadingLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;

    setLoadingLocal(true);
    setError(null);

    try {
      const data: any = await fetchApi("/auth/firebase/owner-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      });

      // Set a synthetic "owner-demo" token so fetchApi Authorization header works
      // The demo token is used as-is; backend skips Firebase verify for this special route.
      setIdToken(`owner-demo:${secret.trim()}`);
      setUser(data.user);
      setSubscription(data.subscription);
      setNeedsOnboarding(data.needs_onboarding === true);

      if (data.workspace) {
        setWorkspaceId(data.workspace.id);
        setNeedsOnboarding(false);
        const ws = {
          id: data.workspace.id,
          name: data.workspace.name,
          slug: data.workspace.slug,
          timezone: data.workspace.timezone || "Asia/Jakarta",
        };
        setWorkspaces([ws]);
        setActiveWorkspace(ws);
      }

      // Redirect to dashboard — full access without payment
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Token salah. Coba lagi.");
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center px-4">
      {/* Ambient blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-3xl p-8 space-y-6 shadow-2xl"
          style={{
            background: "rgba(15,17,26,0.85)",
            border: "1px solid rgba(124,58,237,0.25)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Icon + Title */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h1
                className="text-2xl font-extrabold text-white tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Owner Demo Access
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Masukkan token akses untuk melihat demo Shiera.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                id="owner-secret-input"
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Token akses..."
                autoComplete="off"
                className="w-full pr-12 pl-4 py-3 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(167,139,250,0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15), inset 0 1px 3px rgba(0,0,0,0.3)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
                  e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.3)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-purple-400 transition-colors"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-3 rounded-2xl text-sm text-red-400 flex items-center gap-2"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <span className="shrink-0">⚠️</span>
                {error}
              </div>
            )}

            <button
              id="owner-access-submit"
              type="submit"
              disabled={loading || !secret.trim()}
              className="w-full py-3 px-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk ke Demo</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[11px] text-slate-600">
            Halaman ini hanya untuk internal owner demo.<br />
            Hubungi admin Shiera untuk mendapatkan token.
          </p>
        </div>
      </div>
    </div>
  );
}
