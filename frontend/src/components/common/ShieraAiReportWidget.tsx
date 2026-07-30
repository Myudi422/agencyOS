"use client";

import React, { useState } from "react";
import {
  Sparkles, X, Minimize2, Maximize2, Copy, Check, RefreshCw, Sliders, Bot
} from "lucide-react";

import { useAiReportStore } from "@/store/useAiReportStore";
import ShieraMarkdownViewer from "./ShieraMarkdownViewer";
import { toast } from "@/store/useToastStore";

interface ShieraAiReportWidgetProps {
  onRegenerate?: (customInstructions?: string) => Promise<void>;
}

export default function ShieraAiReportWidget({ onRegenerate }: ShieraAiReportWidgetProps) {
  const {
    isAiModalOpen,
    isAiMinimized,
    aiSummaryText,
    aiLoading,
    aiCustomInstructions,
    aiMeta,
    closeAiModal,
    minimizeAiModal,
    restoreAiModal,
    setAiCustomInstructions,
  } = useAiReportStore();

  const [aiCopied, setAiCopied] = useState(false);
  const [localInstruction, setLocalInstruction] = useState(aiCustomInstructions);

  const copyAiSummary = () => {
    if (!aiSummaryText) return;
    navigator.clipboard.writeText(aiSummaryText);
    setAiCopied(true);
    toast.success("Laporan Shiera AI disalin ke clipboard!");
    setTimeout(() => setAiCopied(false), 3000);
  };

  const handleRegenerateClick = () => {
    if (onRegenerate) {
      setAiCustomInstructions(localInstruction);
      onRegenerate(localInstruction);
    }
  };

  // If no report active and not loading, render nothing
  if (!isAiModalOpen && !isAiMinimized && !aiLoading && !aiSummaryText) {
    return null;
  }

  return (
    <>
      {/* ─── 1. FLOATING MINIMIZED WIDGET (PINS ACROSS ALL PAGES) ─── */}
      {isAiMinimized && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce-short">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-2xl border border-purple-400/30 backdrop-blur-md group hover:scale-[1.03] transition-all cursor-pointer">
            <button
              onClick={restoreAiModal}
              className="flex items-center gap-3 flex-1 text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                {aiLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-purple-300" />
                ) : (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div className="pr-2">
                <p className="text-xs font-bold font-['Outfit'] text-white flex items-center gap-1.5">
                  Shiera AI Summary
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </p>
                <p className="text-[10px] text-purple-200/90 truncate max-w-[180px]">
                  {aiLoading ? "Sedang menganalisis data..." : "Klik untuk buka laporan AI"}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
              <button
                onClick={restoreAiModal}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition-colors"
                title="Buka Laporan"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeAiModal}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. FULL AI REPORT MODAL ─── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between border-b border-purple-500/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-['Outfit'] flex items-center gap-2">
                    Shiera AI Executive Analytics Report
                  </h3>
                  <p className="text-xs text-purple-200/80">
                    Analisis performa kecerdasan buatan Shiera berdasarkan data statistik sosial media
                  </p>
                </div>
              </div>

              {/* Minimize & Close Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={minimizeAiModal}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white flex items-center justify-center transition-colors"
                  title="Minimize Popup"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={closeAiModal}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white flex items-center justify-center transition-colors"
                  title="Tutup Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
              {/* Custom Instruction Bar */}
              <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  Instruksi Khusus untuk Shiera AI (Opsional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localInstruction}
                    onChange={(e) => setLocalInstruction(e.target.value)}
                    placeholder="Contoh: Fokus pada strategi meningkatkan jangkauan TikTok & Reels minggu depan..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  />
                  {onRegenerate && (
                    <button
                      onClick={handleRegenerateClick}
                      disabled={aiLoading}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-60 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {aiLoading ? "Memproses..." : "Regenerate"}
                    </button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {aiLoading && (
                <div className="py-16 flex flex-col items-center justify-center space-y-4 text-purple-900">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <Sparkles className="w-6 h-6 text-purple-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-bold text-sm text-slate-800 font-['Outfit']">Shiera AI Sedang Menganalisis Data...</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Mengkaji engagement rate, perbandingan platform, serta merumuskan strategi rekomendasi khusus untukmu.
                    </p>
                  </div>
                </div>
              )}

              {/* Clean Markdown Rendered Content */}
              {!aiLoading && aiSummaryText && (
                <div className="space-y-4">
                  {/* Meta Bar */}
                  {aiMeta && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-purple-50/80 px-4 py-2 rounded-xl border border-purple-100 flex-wrap gap-2">
                      <span>Periode: <strong>{aiMeta.period_label}</strong></span>
                      <span>Akun Teranalisis: <strong>{aiMeta.total_accounts}</strong></span>
                      <span>Dibuat: <strong>{new Date(aiMeta.generated_at || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>
                  )}

                  {/* Clean Markdown Output Box */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <ShieraMarkdownViewer content={aiSummaryText} />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-600" />
                Powered by <strong>Shiera AI Engine</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={minimizeAiModal}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                  title="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  Minimize
                </button>
                <button
                  onClick={copyAiSummary}
                  disabled={!aiSummaryText || aiLoading}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {aiCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {aiCopied ? "Tersalin!" : "Salin Laporan"}
                </button>
                <button
                  onClick={closeAiModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
