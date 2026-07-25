"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";

export default function GlassToastManager() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[110] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center justify-between p-3.5 sm:p-4 rounded-2xl glass-panel shadow-xl border border-white/90 animate-in slide-in-from-top-4 duration-300 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {t.type === "info" && <Info className="w-5 h-5 text-purple-600" />}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
              {t.message}
            </p>
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors ml-3 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
