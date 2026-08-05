"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bot, Plus, Sparkles, Play, Pause, Trash2, RefreshCw, Clock, Calendar,
  ChevronRight, Check, X, AlertTriangle, RotateCcw, Send, Zap, Settings2,
  Eye, MoreVertical
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAgentStore, AgentConfig, AgentRunLog } from "@/store/useAgentStore";
import { fetchApi } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import ShieraMarkdownViewer from "@/components/common/ShieraMarkdownViewer";
import AgentCreateModal from "@/components/agent/AgentCreateModal";

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸", facebook: "📘", x: "𝕏", tiktok: "🎵",
  youtube: "▶️", linkedin: "💼", pinterest: "📌",
  bluesky: "🦋", threads: "🧵", tiktok_business: "🎵",
};

const STATUS_CONFIG = {
  done: { label: "Selesai", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  running: { label: "Berjalan...", color: "text-blue-600 bg-blue-50 border-blue-200" },
  pending: { label: "Menunggu", color: "text-amber-600 bg-amber-50 border-amber-200" },
  failed: { label: "Gagal", color: "text-red-600 bg-red-50 border-red-200" },
  skipped: { label: "Dilewati", color: "text-slate-500 bg-slate-50 border-slate-200" },
};

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function formatDateTime(iso?: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatTimeOnly(iso?: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({ agent, selected, onSelect }: { agent: AgentConfig; selected: boolean; onSelect: () => void }) {
  const statusColor = agent.is_active
    ? "w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
    : "w-2 h-2 rounded-full bg-slate-300";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${selected
        ? "border-purple-300 bg-purple-50 shadow-sm"
        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${selected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          <Bot className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={statusColor} />
            <p className="text-xs font-bold text-slate-800 truncate">{agent.name}</p>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{agent.content_pillar} · {agent.run_time}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-slate-400">
              🏃 {agent.total_runs} run · 📄 {agent.total_drafts_generated} draft
            </span>
          </div>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 ${selected ? "text-purple-500" : "text-slate-300"}`} />
      </div>
    </button>
  );
}

// ─── Log Card ─────────────────────────────────────────────────────────────────
function LogCard({
  log,
  onTransfer,
  onDeleteLog,
}: {
  log: AgentRunLog;
  onTransfer: (draft: any, log: AgentRunLog) => void;
  onDeleteLog: (logId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus log hasil agent ini?")) return;
    setDeleting(true);
    try {
      await onDeleteLog(log.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <div
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {log.trigger === "manual" ? "⚡ Manual" : "⏰ Terjadwal"}
          </span>
          {log.drafts_count > 0 && (
            <span className="text-[10px] text-emerald-600 font-semibold">
              📄 {log.drafts_count} draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-[10px] text-slate-500">{formatDateTime(log.started_at)}</p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Hapus Log"
            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {log.error_message && (
            <div className="px-4 py-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 border-b border-red-100 break-words">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="break-all">{log.error_message}</span>
            </div>
          )}

          {(log.drafts || []).map((draft, i) => (
            <div key={i} className="p-3 sm:p-4 border-b border-slate-100 last:border-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  Draft Opsi #{i + 1}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatTimeOnly(draft.generated_at)}
                </span>
              </div>

              {/* Account chips */}
              {draft.accounts?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {draft.accounts.map((acc) => (
                    <span key={acc.id} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 font-semibold text-slate-600 truncate max-w-full">
                      {PLATFORM_ICONS[acc.platform] || "🌐"} @{acc.username}
                    </span>
                  ))}
                </div>
              )}

              {/* Brief preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs max-h-72 overflow-y-auto break-words max-w-full">
                <ShieraMarkdownViewer content={draft.brief_text} />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {draft.composer_payload && (
                  <button
                    onClick={() => onTransfer(draft, log)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-bold shadow-sm hover:shadow-purple-500/30 hover:scale-[1.01] transition-all"
                  >
                    <Send className="w-3 h-3 text-amber-300" />
                    Transfer ke Composer
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(draft.brief_text);
                    toast.success("Brief disalin!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition-colors"
                >
                  Salin
                </button>
              </div>
            </div>
          ))}

          {log.status === "done" && log.drafts_count === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">Tidak ada draft dihasilkan.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const { activeWorkspace, openComposerWithBrief } = useStore();
  const {
    agents, selectedAgentId, logs, loadingAgents, loadingLogs,
    fetchAgents, selectAgent, upsertAgent, removeAgent, deleteLog, setRunning, runningAgentIds
  } = useAgentStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [pollingMap, setPollingMap] = useState<Record<string, NodeJS.Timeout>>({});

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchAgents(activeWorkspace.id);
    }
  }, [activeWorkspace?.id]);

  const pollLogs = useCallback((agentId: string) => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchApi<AgentRunLog[]>(`/agents/${agentId}/logs?limit=20`);
        const hasRunning = (data || []).some((l) => l.status === "running" || l.status === "pending");
        useAgentStore.setState({ logs: data || [] });
        if (!hasRunning) {
          clearInterval(interval);
          setPollingMap((p) => { const n = { ...p }; delete n[agentId]; return n; });
          setRunning(agentId, false);
          fetchAgents(activeWorkspace?.id || "");
          toast.success("Agent selesai berjalan! Cek draft baru di bawah.");
        }
      } catch { clearInterval(interval); }
    }, 3000);
    return interval;
  }, [activeWorkspace?.id]);

  const handleRunNow = async (agent: AgentConfig) => {
    setRunning(agent.id, true);
    try {
      await fetchApi(`/agents/${agent.id}/run-now`, { method: "POST" });
      toast.success(`Agent "${agent.name}" sedang berjalan di background...`);
      if (selectedAgentId === agent.id) {
        const interval = pollLogs(agent.id);
        setPollingMap((p) => ({ ...p, [agent.id]: interval }));
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal menjalankan agent.");
      setRunning(agent.id, false);
    }
  };

  const handleToggle = async (agent: AgentConfig) => {
    try {
      const updated = await fetchApi<AgentConfig>(`/agents/${agent.id}/toggle`, { method: "POST" });
      upsertAgent(updated);
      toast.success(updated.is_active ? "Agent diaktifkan!" : "Agent dinonaktifkan.");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengubah status agent.");
    }
  };

  const handleDelete = async (agent: AgentConfig) => {
    if (!confirm(`Hapus agent "${agent.name}"? Semua log run akan dihapus.`)) return;
    try {
      await fetchApi(`/agents/${agent.id}`, { method: "DELETE" });
      removeAgent(agent.id);
      toast.success("Agent dihapus.");
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus agent.");
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteLog(logId);
      toast.success("Log hasil agent dihapus.");
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus log.");
    }
  };

  const handleTransferToComposer = (draft: any, log: AgentRunLog) => {
    const payload = draft.composer_payload || {};
    const accountIds = draft.accounts?.map((a: any) => a.id) || [];
    openComposerWithBrief({
      caption: payload.caption || "",
      hashtags: payload.hashtags || "",
      ai_brief: draft.brief_text || "",
      post_type: payload.post_type || "image",
      account_ids: accountIds,
    });
    toast.success("Brief ditransfer ke PostComposer!");
  };

  const isRunning = (agentId: string) => runningAgentIds.has(agentId);

  return (
    <div className="flex flex-col min-h-screen md:h-screen bg-slate-50 overflow-x-hidden max-w-full">
      {/* Beta Info Banner */}
      <div className="shrink-0 px-4 sm:px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 shrink-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v4M5 8v.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
        <p className="text-[11px] text-amber-800 font-medium leading-snug">
          <span className="font-bold">Info:</span> Menu ini masih dalam tahap pengembangan (Beta). Beberapa fitur mungkin belum berjalan sempurna. Terima kasih atas kesabarannya 🙏
        </p>
        <span className="ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 border border-amber-300">
          Beta
        </span>
      </div>

      {/* Page Header */}
      <div className="shrink-0 px-4 sm:px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 font-['Outfit']">AI Agent</h1>
              <p className="text-[11px] text-slate-500">Otomasi brief konten harian dengan AI</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingAgent(null); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Buat Agent Baru</span>
            <span className="sm:hidden">Buat</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 min-w-0 max-w-full">
        {/* Left Panel: Agent List */}
        <div className={`w-full md:w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col ${selectedAgentId ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {agents.length} Agent Terkonfigurasi
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingAgents ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center text-center py-10 gap-4 px-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Bot className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Belum Ada Agent</p>
                  <p className="text-[11px] text-slate-400 mt-1">Buat agent pertama kamu dan biarkan AI bekerja otomatis setiap hari.</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all"
                >
                  + Buat Agent
                </button>
              </div>
            ) : (
              agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  selected={selectedAgentId === agent.id}
                  onSelect={() => selectAgent(agent.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Agent Detail */}
        <div className={`flex-1 flex-col min-w-0 overflow-hidden ${selectedAgentId ? "flex" : "hidden md:flex"}`}>
          {!selectedAgent ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center gap-4 p-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">Pilih Agent untuk Melihat Detail</p>
                <p className="text-xs text-slate-400 max-w-xs">Klik salah satu agent di kiri, atau buat agent baru untuk memulai.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Agent Header */}
              <div className="shrink-0 px-4 sm:px-6 py-4 bg-white border-b border-slate-200">
                <button
                  onClick={() => selectAgent(null)}
                  className="md:hidden flex items-center gap-1 text-xs text-purple-600 font-semibold mb-3 hover:underline"
                >
                  ← Kembali ke Daftar Agent
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${selectedAgent.is_active ? "bg-gradient-to-br from-purple-600 to-indigo-700 shadow-md shadow-purple-500/25" : "bg-slate-200"}`}>
                      <Bot className={`w-5 h-5 ${selectedAgent.is_active ? "text-amber-300" : "text-slate-500"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-extrabold text-slate-900 font-['Outfit'] truncate">{selectedAgent.name}</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${selectedAgent.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {selectedAgent.is_active ? "● Aktif" : "○ Nonaktif"}
                        </span>
                      </div>
                      {selectedAgent.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{selectedAgent.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleRunNow(selectedAgent)}
                      disabled={isRunning(selectedAgent.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isRunning(selectedAgent.id) ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Berjalan...</>
                      ) : (
                        <><Zap className="w-3.5 h-3.5 text-amber-300" /> Run Sekarang</>
                      )}
                    </button>
                    <button
                      onClick={() => handleToggle(selectedAgent)}
                      title={selectedAgent.is_active ? "Nonaktifkan" : "Aktifkan"}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${selectedAgent.is_active ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
                    >
                      {selectedAgent.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditingAgent(selectedAgent); setShowCreateModal(true); }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedAgent)}
                      className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Agent config pills */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    <Clock className="w-3 h-3" /> {selectedAgent.run_time} {selectedAgent.timezone.split("/").pop()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    <Calendar className="w-3 h-3" /> {(selectedAgent.run_days || []).map((d) => DAY_LABELS[d]).join(", ")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                    📚 {selectedAgent.content_pillar}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                    🎨 {selectedAgent.content_format}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                    📄 Max {selectedAgent.drafts_per_run || 1} Draft/Run
                  </span>
                  {selectedAgent.next_run_at && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      ⏰ Next: {formatDateTime(selectedAgent.next_run_at)}
                    </span>
                  )}
                </div>
              </div>

              {/* Logs */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-700">Riwayat Run</p>
                  <button
                    onClick={() => selectedAgentId && useAgentStore.getState().fetchLogs(selectedAgentId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Eye className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Belum ada riwayat run.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Klik "Run Sekarang" untuk mencoba agent ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <LogCard
                        key={log.id}
                        log={log}
                        onTransfer={handleTransferToComposer}
                        onDeleteLog={handleDeleteLog}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <AgentCreateModal
          onClose={() => { setShowCreateModal(false); setEditingAgent(null); }}
          onSave={(agent) => { upsertAgent(agent); selectAgent(agent.id); }}
          editAgent={editingAgent}
        />
      )}
    </div>
  );
}
