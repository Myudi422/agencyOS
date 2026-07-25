"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

function MetaCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeWorkspace, clients } = useStore();

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting your Meta accounts (Instagram Business & Facebook Pages)...");
  const hasCalledRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(`Meta OAuth Error: ${errorDescription || error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from Meta OAuth.");
      return;
    }

    // Prevent double execution in React 19 StrictMode
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    // Build callback request
    let callbackUrl = `/auth/meta/callback?code=${encodeURIComponent(code)}`;
    if (activeWorkspace?.id) {
      callbackUrl += `&workspace_id=${activeWorkspace.id}`;
    }
    if (clients[0]?.id) {
      callbackUrl += `&client_id=${clients[0].id}`;
    }

    fetchApi<any>(callbackUrl, {
      method: "POST",
    })
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Meta Accounts Successfully Connected!");
        setTimeout(() => {
          router.push("/accounts");
        }, 1800);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(`Failed to complete Meta token exchange: ${err.message || err}`);
      });
  }, [searchParams, activeWorkspace?.id, clients, router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-[#0f111a] border border-border rounded-2xl p-8 max-w-md w-full space-y-4 shadow-2xl glass-card">
        {status === "processing" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-base font-bold text-white font-['Outfit']">Connecting Meta Account</h2>
            <p className="text-xs text-gray-400">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-emerald-400 font-['Outfit']">Connection Successful!</h2>
            <p className="text-xs text-gray-300">{message}</p>
            <p className="text-[10px] text-gray-500">Redirecting to Account Manager...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-pink-400 font-['Outfit']">OAuth Connection Failed</h2>
            <p className="text-xs text-gray-400 leading-relaxed">{message}</p>
            <button
              onClick={() => router.push("/accounts")}
              className="py-2 px-4 rounded-xl gradient-brand text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 mt-2"
            >
              Back to Account Manager
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetaCallbackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Meta Callback...</div>}>
      <MetaCallbackHandler />
    </Suspense>
  );
}
