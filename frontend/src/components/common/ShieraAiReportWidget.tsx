"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, X, Minimize2, Copy, Check, RefreshCw, Send, Bot, User,
  BarChart2, ChevronRight, TrendingUp, Calendar, Users2, Zap,
  RotateCcw, ChevronDown, CheckSquare, Square
} from "lucide-react";
import { useAiReportStore, ChatMessage, SummaryScope } from "@/store/useAiReportStore";
import ShieraMarkdownViewer from "./ShieraMarkdownViewer";
import { fetchApi } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import { useStore } from "@/store/useStore";

interface SocialAccountMeta {
  id: string;
  platform_account_id: string;
  platform: string;
  name: string;
  username: string;
  avatar_url?: string;
  followers_count?: number;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸", facebook: "📘", x: "𝕏", tiktok: "🎵",
  youtube: "▶️", linkedin: "💼", pinterest: "📌",
  bluesky: "🦋", threads: "🧵", tiktok_business: "🎵",
};

type PeriodKey = "today" | "7d" | "30d" | "custom";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "custom", label: "Custom" },
];

function getDateRange(period: PeriodKey, customFrom?: string, customTo?: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      return { from: todayStart.toISOString(), to: todayEnd.toISOString() };
    case "7d": {
      const from = new Date(todayStart);
      from.setDate(from.getDate() - 6);
      return { from: from.toISOString(), to: todayEnd.toISOString() };
    }
    case "30d": {
      const from = new Date(todayStart);
      from.setDate(from.getDate() - 29);
      return { from: from.toISOString(), to: todayEnd.toISOString() };
    }
    case "custom":
      return {
        from: customFrom ? new Date(customFrom + "T00:00:00").toISOString() : todayStart.toISOString(),
        to: customTo ? new Date(customTo + "T23:59:59").toISOString() : todayEnd.toISOString(),
      };
  }
}

// ─── Welcome / Home screen ────────────────────────────────────────────────────
function WelcomeScreen({ onSummaryClick }: { onSummaryClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-5 py-8 gap-5 text-center select-none">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30">
          <Sparkles className="w-8 h-8 text-amber-300" />
        </div>
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-base font-extrabold text-slate-900 font-['Outfit']">
          Halo! Saya Shiera AI 👋
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-[220px]">
          Asisten CMO digital Anda. Ada yang bisa saya bantu hari ini?
        </p>
      </div>

      <button
        onClick={onSummaryClick}
        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all group"
      >
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <BarChart2 className="w-5 h-5 text-amber-300" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-bold leading-tight">Summary Analisa</p>
          <p className="text-[10px] text-purple-200/90 mt-0.5">Mulai analisa performa akun sosial Anda</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>

      <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px]">
        Didukung oleh Shiera AI · Analisis mendalam berbasis data real-time
      </p>
    </div>
  );
}

// ─── Chat area ────────────────────────────────────────────────────────────────
function ChatArea({
  messages,
  aiLoading,
  inputMsg,
  setInputMsg,
  onSend,
  chatScrollRef,
}: {
  messages: ChatMessage[];
  aiLoading: boolean;
  inputMsg: string;
  setInputMsg: (v: string) => void;
  onSend: (e?: React.FormEvent) => void;
  chatScrollRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      <div
        ref={chatScrollRef}
        className="flex-1 px-3 py-4 overflow-y-auto space-y-3 bg-slate-50/80 min-h-0"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-900 text-amber-300 border border-purple-400/30"
              }`}
            >
              {msg.sender === "user"
                ? <User className="w-3.5 h-3.5" />
                : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
              }`}
            >
              {msg.sender === "user"
                ? <p className="whitespace-pre-wrap">{msg.text}</p>
                : <ShieraMarkdownViewer content={msg.text} />}
            </div>
          </div>
        ))}

        {aiLoading && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-amber-300 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-purple-700 font-semibold flex items-center gap-2 shadow-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Shiera AI sedang merumuskan jawaban...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={onSend}
        className="px-3 py-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Tanyakan sesuatu..."
          disabled={aiLoading}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 font-medium placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim() || aiLoading}
          className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────
type PanelView = "welcome" | "configure" | "chat";

export default function ShieraAiReportWidget() {
  const { activeWorkspace } = useStore();

  const {
    isFloatingOpen, isAiMinimized,
    aiLoading, aiMeta, chatMessages, hasSummarySession,
    openFloating, closeFloating,
    closeAiModal, minimizeAiModal, restoreAiModal,
    setAiSummaryText, setAiLoading, setAiMeta,
    addChatMessage, setChatMessages,
    setHasSummarySession, resetAiReport
  } = useAiReportStore();

  const [view, setView] = useState<PanelView>("welcome");
  const [inputMsg, setInputMsg] = useState("");
  const [aiCopied, setAiCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Filters State (Local to matching Statistics screen options) ──
  const [availableAccounts, setAvailableAccounts] = useState<SocialAccountMeta[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Accounts
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    fetchApi<SocialAccountMeta[]>(`/statistics/accounts?workspace_id=${activeWorkspace.id}`)
      .then((accs) => {
        setAvailableAccounts(accs);
      })
      .catch(() => setAvailableAccounts([]));
  }, [activeWorkspace?.id]);

  // Outside click for accounts dropdown
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, aiLoading]);

  // Restore active view state
  useEffect(() => {
    if (isFloatingOpen && hasSummarySession && chatMessages.length > 0) {
      setView("chat");
    } else if (isFloatingOpen && !hasSummarySession) {
      setView("welcome");
    }
  }, [isFloatingOpen, hasSummarySession, chatMessages.length]);

  // Tooltip trigger
  useEffect(() => {
    tooltipTimerRef.current = setTimeout(() => {
      if (!isFloatingOpen) setShowTooltip(true);
    }, 2000);
    return () => { if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); };
  }, [isFloatingOpen]);

  const handleFabClick = () => {
    setShowTooltip(false);
    if (isAiMinimized) {
      restoreAiModal();
    }
    openFloating();
  };

  const handleClose = () => {
    closeFloating();
    closeAiModal();
  };

  const handleMinimize = () => {
    minimizeAiModal();
    closeFloating();
  };

  const handleResetChat = () => {
    resetAiReport();
    setSelectedAccountIds([]);
    setPeriod("today");
    setCustomFrom("");
    setCustomTo("");
    setView("welcome");
    toast.success("Sesi chat berhasil di-reset!");
  };

  // Run AI Summary Analysis based on selected Filters
  const handleRunAnalysis = async () => {
    if (!activeWorkspace?.id) {
      toast.error("Workspace tidak ditemukan.");
      return;
    }

    setAiLoading(true);

    try {
      const { from, to } = getDateRange(period, customFrom, customTo);
      const res: any = await fetchApi("/statistics/ai-summary", {
        method: "POST",
        body: JSON.stringify({
          workspace_id: activeWorkspace.id,
          account_ids: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
          date_from: from,
          date_to: to,
        }),
      });

      const summaryText = res.summary || "Tidak ada hasil analisis.";
      setAiSummaryText(summaryText);
      setAiMeta({
        period_label: res.period_label,
        total_accounts: res.total_accounts,
        generated_at: res.generated_at,
        workspace_id: activeWorkspace.id,
        account_ids: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
        date_from: from,
        date_to: to,
      });
      setChatMessages([
        {
          id: "init-ai-" + Date.now(),
          sender: "ai",
          text: summaryText,
          timestamp: new Date().toISOString(),
        },
      ]);
      setHasSummarySession(true);
      setView("chat");
      toast.success("Analisis Shiera AI berhasil dibuat!");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat Laporan AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendFollowUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMsg.trim();
    if (!text || aiLoading || !aiMeta?.workspace_id) return;

    const userMsgObj: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsgObj);
    setInputMsg("");
    setAiLoading(true);

    try {
      const res: any = await fetchApi("/statistics/ai-summary", {
        method: "POST",
        body: JSON.stringify({
          workspace_id: aiMeta.workspace_id,
          account_ids: aiMeta.account_ids,
          date_from: aiMeta.date_from,
          date_to: aiMeta.date_to,
          user_message: text,
          chat_history: [...chatMessages, userMsgObj].map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      addChatMessage({
        id: "ai-" + Date.now(),
        sender: "ai",
        text: res.summary || "Maaf, saya tidak dapat memproses tanggapan.",
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim pesan ke Shiera AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const copyFullReport = () => {
    const fullText = chatMessages
      .filter((m) => m.sender === "ai")
      .map((m) => m.text)
      .join("\n\n---\n\n");
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setAiCopied(true);
    toast.success("Laporan disalin ke clipboard!");
    setTimeout(() => setAiCopied(false), 3000);
  };

  const selectedAccountNames = selectedAccountIds.length === 0
    ? "Semua Akun"
    : availableAccounts.filter(a => selectedAccountIds.includes(a.id)).map(a => `@${a.username}`).join(", ");

  const hasActiveSession = hasSummarySession && chatMessages.length > 0;

  return (
    <>
      {/* ─── FAB BUTTON ─── */}
      {!isFloatingOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {showTooltip && !isAiMinimized && (
            <div className="animate-fade-in flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/10 mb-1 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
              Ada yang bisa dibantu?
              <button
                onClick={() => setShowTooltip(false)}
                className="ml-1 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {isAiMinimized && hasActiveSession && (
            <div
              onClick={handleFabClick}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white shadow-2xl border border-purple-400/30 cursor-pointer hover:scale-[1.02] transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300">
                {aiLoading
                  ? <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                  : <Sparkles className="w-4 h-4 animate-pulse" />}
              </div>
              <div>
                <p className="text-xs font-bold font-['Outfit'] flex items-center gap-1.5">
                  Shiera AI
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </p>
                <p className="text-[10px] text-purple-200/90">
                  {aiLoading ? "Sedang mengetik..." : `${chatMessages.length} pesan`}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleFabClick}
            onMouseEnter={() => { if (!showTooltip) setShowTooltip(true); }}
            onMouseLeave={() => setShowTooltip(false)}
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-white shadow-xl shadow-purple-500/35 hover:shadow-purple-500/50 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/10"
            title="Shiera AI"
          >
            <Sparkles className="w-6 h-6 text-amber-300" />
            {hasActiveSession && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              </span>
            )}
          </button>
        </div>
      )}

      {/* ─── FLOATING PANEL ─── */}
      {isFloatingOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden bg-white animate-slide-up"
          style={{ height: view === "welcome" ? "auto" : "560px" }}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 border border-purple-300/40 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-['Outfit'] text-white">Shiera AI</h3>
                <p className="text-[10px] text-purple-200/80">CMO & Analytics Specialist</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {hasActiveSession && (
                <button
                  onClick={handleResetChat}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                  title="Reset Chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              {view === "chat" && (
                <button
                  onClick={copyFullReport}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                  title="Salin Laporan"
                >
                  {aiCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
              {view === "chat" && (
                <button
                  onClick={handleMinimize}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Meta Bar */}
          {view === "chat" && aiMeta && (
            <div className="bg-purple-50 border-b border-purple-100 px-4 py-2 text-[10px] text-slate-600 flex items-center justify-between shrink-0 flex-wrap gap-1">
              <span>Periode: <strong>{aiMeta.period_label}</strong></span>
              <span>{aiMeta.total_accounts} akun teranalisis</span>
              <button
                onClick={() => setView("configure")}
                className="text-purple-600 font-bold hover:underline"
              >
                Ubah Filter / Periode →
              </button>
            </div>
          )}

          {/* Views */}
          {view === "welcome" && (
            <WelcomeScreen
              onSummaryClick={() => setView("configure")}
            />
          )}

          {view === "configure" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 font-['Outfit']">Summary Analisa</h3>
                  <p className="text-[11px] text-slate-500">Konfigurasi filter & periode analisa statistik</p>
                </div>

                {/* Account Filter dropdown */}
                <div className="space-y-1.5" ref={dropdownRef}>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pilih Akun</label>
                  <div className="relative">
                    <button
                      onClick={() => setAccountDropdownOpen(v => !v)}
                      className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/75 border border-slate-200 text-xs font-semibold text-slate-700 transition-all w-full"
                    >
                      <span className="truncate flex-1 text-left">{selectedAccountNames}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                    
                    {accountDropdownOpen && (
                      <div className="absolute top-full mt-1 left-0 z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto p-2 space-y-0.5">
                        <button
                          onClick={() => { setSelectedAccountIds([]); setAccountDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            selectedAccountIds.length === 0 ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Semua Akun
                        </button>
                        {availableAccounts.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">Belum ada akun terhubung</p>
                        ) : (
                          availableAccounts.map(acc => {
                            const isSelected = selectedAccountIds.includes(acc.id);
                            return (
                              <button
                                key={acc.id}
                                onClick={() => {
                                  setSelectedAccountIds(prev =>
                                    isSelected ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                                  );
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                                  isSelected ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                )}
                                <div className="flex-1 text-left min-w-0">
                                  <p className="font-semibold truncate">{acc.name}</p>
                                  <p className="text-[10px] text-slate-400">@{acc.username} · {PLATFORM_ICONS[acc.platform]} {acc.platform}</p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Period Filter pills */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Periode Waktu</label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
                    {PERIOD_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setPeriod(opt.key)}
                        className={`py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap text-center ${
                          period === opt.key ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom date range fields */}
                {period === "custom" && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Dari</span>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={e => setCustomFrom(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                    <span className="text-xs text-slate-400 mt-4">–</span>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Sampai</span>
                      <input
                        type="date"
                        value={customTo}
                        onChange={e => setCustomTo(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <button
                  onClick={handleRunAnalysis}
                  disabled={aiLoading || (period === "custom" && (!customFrom || !customTo))}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] transition-all disabled:opacity-60"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                      <span>Sedang Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Analisis Sekarang</span>
                    </>
                  )}
                </button>

                {hasActiveSession && !aiLoading && (
                  <button
                    onClick={() => setView("chat")}
                    className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                )}
                {!hasActiveSession && (
                  <button
                    onClick={() => setView("welcome")}
                    className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Kembali
                  </button>
                )}
              </div>
            </div>
          )}

          {view === "chat" && (
            <ChatArea
              messages={chatMessages}
              aiLoading={aiLoading}
              inputMsg={inputMsg}
              setInputMsg={setInputMsg}
              onSend={handleSendFollowUp}
              chatScrollRef={chatScrollRef as React.RefObject<HTMLDivElement>}
            />
          )}
        </div>
      )}
    </>
  );
}
