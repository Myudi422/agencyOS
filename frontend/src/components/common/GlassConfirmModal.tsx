"use client";

import React from "react";
import { AlertTriangle, Trash2, X, Info } from "lucide-react";

interface GlassConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function GlassConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: GlassConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header Icon & Close Button */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
            variant === "danger"
              ? "bg-rose-100 text-rose-600 border border-rose-200"
              : variant === "warning"
              ? "bg-amber-100 text-amber-600 border border-amber-200"
              : "bg-purple-100 text-purple-600 border border-purple-200"
          }`}>
            {variant === "danger" ? (
              <Trash2 className="w-6 h-6" />
            ) : variant === "warning" ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )}
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-2xl text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all ${
              variant === "danger"
                ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/25"
                : "gradient-brand shadow-purple-500/25"
            } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
