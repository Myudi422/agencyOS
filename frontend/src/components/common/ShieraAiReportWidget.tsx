"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles, X, Minimize2, Maximize2, Copy, Check, RefreshCw, Send, Bot, User, ArrowDown
} from "lucide-react";
import { useAiReportStore, ChatMessage } from "@/store/useAiReportStore";
import ShieraMarkdownViewer from "./ShieraMarkdownViewer";
import { fetchApi } from "@/lib/api";
import { toast } from "@/store/useToastStore";

export default function ShieraAiReportWidget() {
  const {
    isAiModalOpen,
    isAiMinimized,
    aiLoading,
    aiMeta,
    chatMessages,
    closeAiModal,
    minimizeAiModal,
    restoreAiModal,
    addChatMessage,
    setAiLoading,
  } = useAiReportStore();

  const [inputMsg, setInputMsg] = useState("");
  const [aiCopied, setAiCopied] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, aiLoading]);

  const handleSendFollowUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMsg.trim();
    if (!text || aiLoading || !aiMeta?.workspace_id) return;

    // Append user message immediately
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
      // Send chat history + user message to backend
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

      const aiMsgObj: ChatMessage = {
        id: "ai-" + Date.now(),
        sender: "ai",
        text: res.summary || "Maaf, saya tidak dapat memproses tanggapan.",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(aiMsgObj);
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
    toast.success("Laporan percakapan AI disalin ke clipboard!");
    setTimeout(() => setAiCopied(false), 3000);
  };

  if (!isAiModalOpen && !isAiMinimized && !aiLoading && chatMessages.length === 0) {
    return null;
  }

  return (
    <>
      {/* ─── 1. FLOATING MINIMIZED WIDGET (PINS ACROSS ALL PAGES) ─── */}
      {isAiMinimized && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce-short">
          <div
            onClick={restoreAiModal}
            className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-2xl border border-purple-400/30 backdrop-blur-md group hover:scale-[1.03] transition-all cursor-pointer"
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
                Shiera AI Assistant
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </p>
              <p className="text-[10px] text-purple-200/90 truncate max-w-[180px]">
                {aiLoading ? "Sedang mengetik..." : `${chatMessages.length} pesan percakapan`}
              </p>
            </div>
            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  restoreAiModal();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition-colors"
                title="Buka Chat AI"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeAiModal();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. INTERACTIVE CHAT BUBBLE DRAWER MODAL ─── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl shadow-2xl max-w-3xl w-full h-[88vh] overflow-hidden flex flex-col">
            {/* Chat Drawer Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between border-b border-purple-500/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 border border-purple-300/40 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  </div>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Outfit'] flex items-center gap-2 text-white">
                    Shiera AI Assistant
                  </h3>
                  <p className="text-[11px] text-purple-200/80">
                    CMO & Analytics Specialist · Diskusi Laporan Statistik
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyFullReport}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                  title="Salin Percakapan"
                >
                  {aiCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={minimizeAiModal}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                  title="Minimize Popup"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={closeAiModal}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
                  title="Tutup Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meta Bar */}
            {aiMeta && (
              <div className="bg-purple-900/10 border-b border-purple-100 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between shrink-0 flex-wrap gap-2">
                <span>Periode: <strong>{aiMeta.period_label}</strong></span>
                <span>Akun Teranalisis: <strong>{aiMeta.total_accounts}</strong></span>
              </div>
            )}

            {/* Chat Messages Body Container */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-100/50"
            >
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      msg.sender === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-amber-300 border border-purple-400/30"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  {/* Bubble content */}
                  <div
                    className={`max-w-[85%] rounded-3xl p-4 sm:p-5 shadow-xs text-xs sm:text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-tr-xs"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs space-y-2"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <ShieraMarkdownViewer content={msg.text} />
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {aiLoading && (
                <div className="flex gap-3 flex-row items-center">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 border border-purple-400/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs text-purple-700 font-semibold flex items-center gap-2 shadow-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Shiera AI sedang merumuskan jawaban...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Footer */}
            <form
              onSubmit={handleSendFollowUp}
              className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Tanyakan sesuatu tentang laporan statistik ini..."
                disabled={aiLoading}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 font-medium placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || aiLoading}
                className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md shadow-purple-500/20"
                title="Kirim Pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
