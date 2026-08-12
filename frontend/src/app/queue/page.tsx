"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Cpu, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, RotateCcw, Trash2, History, ExternalLink,
  Zap, XCircle, ChevronRight, Filter, Search,
  ArrowUpRight, CreditCard, Loader2, Globe, Hourglass,
  Play, X, Eye, Video, FileText, Calendar, Edit3,
  Send, CalendarClock, ChevronDown, MoreHorizontal,
  PenLine, ClipboardList, BanIcon, TimerOff, Flame, HelpCircle
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { confirmModal } from "@/store/useConfirmStore";
import { fetchApi } from "@/lib/api";
import { startAppTour } from "@/components/tour/AppTour";

/* ─── Types ─── */
type LocalPostStatus = "draft" | "scheduled" | "processing" | "processed";
type QueueTab = "draft" | "terjadwal" | "diproses" | "riwayat";

interface LocalPost {
  id: string;
  workspace_id: string;
  title?: string;
  status: LocalPostStatus;
  content?: { text?: string };
  caption?: string;
  platforms?: string[];
  targets?: { target_id?: string; account_id?: string; platform: string; username: string; avatar_url?: string }[];
  scheduled_at?: string;
  updated_at: string;
  created_at?: string;
  media_urls?: string[];
}

interface PfPost {
  postforme_id: string;
  local_id?: string;
  status: string;
  caption?: string;
  scheduled_at?: string;
  published_at?: string;
  created_at?: string;
  media_urls?: string[];
  targets?: { platform: string; username: string; avatar_url?: string }[];
}

interface PfResult {
  result_id?: string;
  postforme_post_id?: string;
  status?: string;
  success?: boolean;
  platform: string;
  username: string;
  avatar_url?: string;
  platform_url?: string;
  platform_post_id?: string;
  error_data?: string;
  post_caption?: string;
  media_urls?: string[];
  result_at?: string;
  published_at?: string;
}

/* ─── Constants ─── */
const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸", facebook: "📘", x: "𝕏", tiktok: "🎵",
  youtube: "▶️", linkedin: "💼", pinterest: "📌",
  bluesky: "🦋", threads: "🧵", tiktok_business: "🎵"
};
const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-50 text-pink-700 border-pink-200",
  facebook: "bg-blue-50 text-blue-700 border-blue-200",
  x: "bg-slate-50 text-slate-700 border-slate-200",
  tiktok: "bg-gray-900 text-white border-gray-700",
  youtube: "bg-red-50 text-red-700 border-red-200",
  linkedin: "bg-sky-50 text-sky-700 border-sky-200",
  pinterest: "bg-rose-50 text-rose-700 border-rose-200",
  bluesky: "bg-cyan-50 text-cyan-700 border-cyan-200",
  threads: "bg-purple-50 text-purple-700 border-purple-200",
};

/* ─── Timezone helpers ─── */
// WIB = UTC+7
function toWIB(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const dt = new Date(isoString);
    return dt.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }) + " WIB";
  } catch { return isoString; }
}

function toUTCLabel(isoString?: string): string {
  if (!isoString) return "";
  try {
    const dt = new Date(isoString);
    return dt.toLocaleString("en-GB", {
      timeZone: "UTC",
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    }) + " UTC";
  } catch { return ""; }
}

function isDatePast(isoString?: string): boolean {
  if (!isoString) return false;
  return new Date(isoString) < new Date();
}

/* ─── Platform Tags Row ─── */
function PlatformTags({ targets }: { targets?: { platform: string; username: string; avatar_url?: string }[] }) {
  if (!targets || targets.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {targets.slice(0, 4).map((t, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${PLATFORM_COLORS[t.platform] || "bg-slate-50 text-slate-600 border-slate-200"}`}
        >
          {t.avatar_url
            ? <img src={t.avatar_url} alt={t.username} className="w-3 h-3 rounded-full object-cover" />
            : <span>{PLATFORM_ICONS[t.platform] || "📱"}</span>
          }
          @{t.username}
        </span>
      ))}
      {targets.length > 4 && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-bold">+{targets.length - 4}</span>
      )}
    </div>
  );
}

/* ─── Scheduled Time Display (WIB + UTC) ─── */
function ScheduledTimeDisplay({ scheduledAt, label = "Tayang" }: { scheduledAt?: string; label?: string }) {
  if (!scheduledAt) return null;
  const past = isDatePast(scheduledAt);
  return (
    <div className={`flex flex-col gap-0.5 ${past ? "opacity-60" : ""}`}>
      <span className={`text-[11px] font-semibold flex items-center gap-1 ${past ? "text-slate-500" : "text-blue-700"}`}>
        <CalendarClock className="w-3 h-3" />
        {label}: {toWIB(scheduledAt)}
      </span>
      <span className="text-[10px] text-slate-400 pl-4">{toUTCLabel(scheduledAt)}</span>
    </div>
  );
}

/* ─── Media Preview Modal ─── */
function MediaPreviewModal({ url, type, caption, onClose }: {
  url: string; type: "image" | "video"; caption?: string; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            {type === "video" ? <Video className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-purple-400" />}
            <span>{type === "video" ? "Pratinjau Video" : "Pratinjau Gambar"}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 bg-black flex items-center justify-center min-h-[280px]">
          {type === "video"
            ? <video src={url} controls autoPlay playsInline className="max-h-[60vh] w-full object-contain" />
            : <img src={url} alt="Preview" className="max-h-[60vh] w-full object-contain" />
          }
        </div>
        {caption && (
          <div className="p-4 bg-slate-900 text-slate-300 text-xs border-t border-slate-800 max-h-24 overflow-y-auto">
            <p className="font-semibold text-slate-400 text-[10px] uppercase mb-1">Caption:</p>
            <p>{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Queue Page ─── */
export default function QueuePage() {
  const { activeWorkspace, openComposer } = useStore();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as QueueTab) || "draft";
  const [activeTab, setActiveTab] = useState<QueueTab>(initialTab);

  /* ── Draft tab (local posts) ── */
  const [drafts, setDrafts] = useState<LocalPost[]>([]);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsOffset, setDraftsOffset] = useState(0);
  const [draftSearch, setDraftSearch] = useState("");

  /* ── Terjadwal tab (PostForMe scheduled) ── */
  const [scheduled, setScheduled] = useState<PfPost[]>([]);
  const [scheduledTotal, setScheduledTotal] = useState(0);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduledOffset, setScheduledOffset] = useState(0);

  /* ── Diproses tab (PostForMe processing + processed) ── */
  const [processed, setProcessed] = useState<PfPost[]>([]);
  const [processedTotal, setProcessedTotal] = useState(0);
  const [processedLoading, setProcessedLoading] = useState(false);
  const [processedOffset, setProcessedOffset] = useState(0);

  /* ── Riwayat tab ── */
  const [history, setHistory] = useState<PfResult[]>([]);
  const [historyMeta, setHistoryMeta] = useState<any>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterSuccess, setFilterSuccess] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  /* ── Media Preview ── */
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: "image" | "video"; caption?: string } | null>(null);
  const [failedMedia, setFailedMedia] = useState<Record<string, boolean>>({});

  const isVideo = (url?: string) => {
    if (!url) return false;
    const clean = url.split("?")[0].toLowerCase();
    return /\.(mp4|mov|webm|avi|mkv|m4v)(\\?|$)/i.test(clean) || clean.includes("video");
  };

  /* ─── LOAD FUNCTIONS ─── */

  const loadDrafts = useCallback(async (offset = 0) => {
    if (!activeWorkspace?.id) return;
    setDraftsLoading(true);
    try {
      let url = `/posts/?workspace_id=${activeWorkspace.id}&limit=20&offset=${offset}&status=draft`;
      if (draftSearch.trim()) url += `&search=${encodeURIComponent(draftSearch.trim())}`;
      const data = await fetchApi<any>(url);
      const items = Array.isArray(data) ? data : (data?.data ?? []);
      setDrafts(items);
      setDraftsTotal(typeof data?.total === "number" ? data.total : items.length);
      setDraftsOffset(offset);
    } catch {
      setDrafts([]); setDraftsTotal(0);
    } finally {
      setDraftsLoading(false);
    }
  }, [activeWorkspace?.id, draftSearch]);

  const loadScheduled = useCallback(async (offset = 0) => {
    if (!activeWorkspace?.id) return;
    setScheduledLoading(true);
    try {
      const data = await fetchApi<any>(
        `/queue/postforme/posts?workspace_id=${activeWorkspace.id}&status=scheduled&limit=20&offset=${offset}`
      );
      const items: PfPost[] = data?.data ?? [];
      setScheduled(items);
      setScheduledTotal(data?.meta?.total ?? items.length);
      setScheduledOffset(offset);
    } catch {
      setScheduled([]); setScheduledTotal(0);
    } finally {
      setScheduledLoading(false);
    }
  }, [activeWorkspace?.id]);

  const loadProcessed = useCallback(async (offset = 0) => {
    if (!activeWorkspace?.id) return;
    setProcessedLoading(true);
    try {
      const data = await fetchApi<any>(
        `/queue/postforme/posts?workspace_id=${activeWorkspace.id}&status=processing,processed&limit=20&offset=${offset}`
      );
      const items: PfPost[] = data?.data ?? [];
      setProcessed(items);
      setProcessedTotal(data?.meta?.total ?? items.length);
      setProcessedOffset(offset);
    } catch {
      setProcessed([]); setProcessedTotal(0);
    } finally {
      setProcessedLoading(false);
    }
  }, [activeWorkspace?.id]);

  const loadHistory = useCallback(async (offset = 0) => {
    if (!activeWorkspace?.id) return;
    setHistoryLoading(true);
    try {
      let url = `/queue/history?workspace_id=${activeWorkspace.id}&limit=20&offset=${offset}`;
      if (filterPlatform) url += `&platform=${filterPlatform}`;
      if (filterSuccess !== "") url += `&success=${filterSuccess === "true"}`;
      const data = await fetchApi<any>(url);
      setHistory(data?.data ?? []);
      setHistoryMeta(data?.meta ?? {});
      setHistoryOffset(offset);
    } catch {
      setHistory([]); setHistoryMeta({});
    } finally {
      setHistoryLoading(false);
    }
  }, [activeWorkspace?.id, filterPlatform, filterSuccess]);

  /* ─── Effects ─── */
  useEffect(() => {
    if (activeTab === "draft") loadDrafts(0);
    else if (activeTab === "terjadwal") loadScheduled(0);
    else if (activeTab === "diproses") loadProcessed(0);
    else loadHistory(0);
  }, [activeWorkspace?.id, activeTab]);

  useEffect(() => { if (activeTab === "draft") loadDrafts(0); }, [draftSearch]);
  useEffect(() => { if (activeTab === "riwayat") loadHistory(0); }, [filterPlatform, filterSuccess]);

  /* ── Auto-Switch Active Tab during Queue AppTour ── */
  useEffect(() => {
    const handleTourStep = (e: any) => {
      const { flow, stepId } = e.detail || {};
      if (flow === "queue") {
        if (stepId === "queue-tab-draft") setActiveTab("draft");
        else if (stepId === "queue-tab-terjadwal") setActiveTab("terjadwal");
        else if (stepId === "queue-tab-diproses") setActiveTab("diproses");
        else if (stepId === "queue-tab-riwayat") setActiveTab("riwayat");
      }
    };
    window.addEventListener("shiera-tour-step-changed", handleTourStep as EventListener);
    return () => window.removeEventListener("shiera-tour-step-changed", handleTourStep as EventListener);
  }, []);

  /* ─── ACTIONS ─── */

  const handleDeleteDraft = (post: LocalPost) => {
    confirmModal({
      title: "Hapus Draft",
      message: "Apakah kamu yakin ingin menghapus draft ini?",
      variant: "danger", confirmText: "Hapus Permanen",
      onConfirm: async () => {
        try {
          await fetchApi(`/posts/${post.id}`, { method: "DELETE" });
          toast.success("Draft dihapus.");
          loadDrafts(draftsOffset);
        } catch { toast.error("Gagal menghapus draft."); }
      }
    });
  };

  const handleCancelScheduled = (post: PfPost) => {
    confirmModal({
      title: "Batalkan Jadwal",
      message: `Apakah kamu yakin ingin membatalkan jadwal post ini? Post akan dihapus dari antrean dan tidak akan tayang.`,
      variant: "danger", confirmText: "Batalkan Jadwal",
      onConfirm: async () => {
        try {
          await fetchApi(`/queue/postforme/${post.postforme_id}?workspace_id=${activeWorkspace?.id}`, { method: "DELETE" });
          toast.success("Jadwal dibatalkan.");
          loadScheduled(scheduledOffset);
        } catch { toast.error("Gagal membatalkan jadwal."); }
      }
    });
  };

  const handleSyncResults = async () => {
    if (!activeWorkspace?.id) return;
    setIsSyncing(true);
    try {
      await fetchApi(`/queue/sync-results?workspace_id=${activeWorkspace.id}`, { method: "POST" });
      toast.success("Sinkronisasi dimulai! Hasil akan diperbarui sebentar lagi.");
      setTimeout(() => { loadHistory(0); setIsSyncing(false); }, 3000);
    } catch { toast.error("Gagal sinkronisasi."); setIsSyncing(false); }
  };

  const refresh = () => {
    if (activeTab === "draft") loadDrafts(draftsOffset);
    else if (activeTab === "terjadwal") loadScheduled(scheduledOffset);
    else if (activeTab === "diproses") loadProcessed(processedOffset);
    else loadHistory(historyOffset);
  };

  const isLoading = draftsLoading || scheduledLoading || processedLoading || historyLoading;

  /* ─── Tab Config ─── */
  const TABS = [
    { key: "draft" as QueueTab, icon: PenLine, label: "Draft", count: draftsTotal, color: "text-slate-600" },
    { key: "terjadwal" as QueueTab, icon: CalendarClock, label: "Terjadwal", count: scheduledTotal, color: "text-blue-600" },
    { key: "diproses" as QueueTab, icon: Flame, label: "Diproses", count: processedTotal, color: "text-amber-600" },
    { key: "riwayat" as QueueTab, icon: History, label: "Riwayat", count: historyMeta?.total || 0, color: "text-emerald-600" },
  ];

  /* ─── Render ─── */
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div data-tour="queue-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200">
              Publishing Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Manage Posts &amp; Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Draft tersimpan lokal. Jadwal &amp; riwayat tayang diambil langsung dari sistem. Waktu ditampilkan dalam <strong>WIB (UTC+7)</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 z-10 flex-wrap">
          {activeTab === "riwayat" && (
            <button
              onClick={handleSyncResults}
              disabled={isSyncing}
              className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 disabled:opacity-60"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{isSyncing ? "Menyinkronkan..." : "Sync Riwayat"}</span>
            </button>
          )}
          <button
            onClick={() => startAppTour("queue")}
            className="py-3 px-4 rounded-2xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 text-purple-700 font-semibold text-xs flex items-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
            title="Mulai Panduan Interaktif Queue"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Tutorial</span>
          </button>
          <button
            onClick={refresh}
            className="py-3 px-5 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 shadow-xs transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div data-tour="queue-tabs" className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit flex-wrap">
        {TABS.map(({ key, icon: Icon, label, count, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${activeTab === key ? color : ""}`} />
            {label}
            {count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${activeTab === key ? "bg-purple-100 text-purple-700" : "bg-slate-200 text-slate-500"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ TAB: DRAFT ═══ */}
      {activeTab === "draft" && (
        <div data-tour="queue-tab-draft-content" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl glass-card">
            <div className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-purple-300">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                value={draftSearch}
                onChange={e => setDraftSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadDrafts(0)}
                placeholder="Cari draft..."
                className="flex-1 text-xs bg-transparent text-slate-700 outline-none placeholder-slate-400"
              />
            </div>
            <div className="ml-auto text-xs text-slate-400 font-medium">{draftsTotal} draft</div>
          </div>

          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PenLine className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Draft Lokal</h3>
              <span className="ml-1 text-[10px] text-slate-400 font-normal">— Belum dijadwalkan</span>
            </div>

            {draftsLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-sm font-medium">Memuat draft...</span>
              </div>
            ) : drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <PenLine className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">Tidak ada draft tersimpan</p>
                <p className="text-xs">Buat postingan baru dan simpan sebagai draft</p>
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.map(post => {
                  const caption = post.content?.text || post.caption || "";
                  return (
                    <div key={post.id} className="group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-sm hover:border-purple-200 transition-all">
                      <div className="hidden sm:block w-1 h-full self-stretch rounded-full bg-slate-300 shrink-0" style={{ minHeight: 40 }} />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <PenLine className="w-3 h-3" /> Draft
                          </span>
                          {post.targets && <PlatformTags targets={post.targets.map(t => ({ platform: t.platform, username: t.username, avatar_url: t.avatar_url }))} />}
                        </div>
                        {caption ? (
                          <p className="text-sm text-slate-800 line-clamp-2 leading-snug font-medium">{caption}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Tidak ada caption</p>
                        )}
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                          <span>ID: {post.id.slice(0, 8)}...</span>
                          <span>Diperbarui: {new Date(post.updated_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openComposer(post.targets?.map(t => t.account_id).filter((id): id is string => Boolean(id)) || [], post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all"
                        >
                          <Edit3 className="w-3 h-3" /> Edit & Jadwalkan
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(post)}
                          className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {draftsTotal > 20 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">{draftsOffset + 1}–{Math.min(draftsOffset + 20, draftsTotal)} dari {draftsTotal}</p>
                <div className="flex gap-2">
                  <button disabled={draftsOffset === 0} onClick={() => loadDrafts(draftsOffset - 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">← Sebelumnya</button>
                  <button disabled={draftsOffset + 20 >= draftsTotal} onClick={() => loadDrafts(draftsOffset + 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">Berikutnya →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: TERJADWAL ═══ */}
      {activeTab === "terjadwal" && (
        <div data-tour="queue-tab-terjadwal-content" className="space-y-4">
          {/* Info banner */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
            <Globe className="w-4 h-4 shrink-0" />
            <span>Data diambil langsung dari sistem antrean. Waktu tayang ditampilkan dalam <strong>WIB (UTC+7)</strong> dan <strong>UTC</strong>.</span>
          </div>

          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Antrean Jadwal</h3>
                <span className="text-[10px] text-slate-400">— {scheduledTotal} postingan terjadwal</span>
              </div>
            </div>

            {scheduledLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Memuat jadwal...</span>
              </div>
            ) : scheduled.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <CalendarClock className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">Tidak ada postingan terjadwal</p>
                <p className="text-xs">Jadwalkan postingan dari Composer atau Draft</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scheduled.map(post => {
                  const caption = post.caption || "";
                  const isPast = isDatePast(post.scheduled_at);
                  return (
                    <div
                      key={post.postforme_id}
                      className={`group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border bg-white hover:shadow-sm transition-all ${isPast ? "border-slate-200 opacity-70" : "border-blue-100 hover:border-blue-300"}`}
                    >
                      <div className="hidden sm:block w-1 self-stretch rounded-full shrink-0" style={{ background: isPast ? "#94a3b8" : "#3b82f6", minHeight: 40 }} />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${isPast ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {isPast ? <TimerOff className="w-3 h-3" /> : <CalendarClock className="w-3 h-3" />}
                            {isPast ? "Jadwal Lewat" : "Terjadwal"}
                          </span>
                          {post.targets && <PlatformTags targets={post.targets} />}
                        </div>
                        {caption ? (
                          <p className="text-sm text-slate-800 line-clamp-2 leading-snug font-medium">{caption}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Tidak ada caption</p>
                        )}
                        <ScheduledTimeDisplay scheduledAt={post.scheduled_at} />
                        <span className="text-[9px] text-slate-400 font-mono">ID: {post.postforme_id}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCancelScheduled(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
                        >
                          <BanIcon className="w-3 h-3" /> Batalkan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {scheduledTotal > 20 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">{scheduledOffset + 1}–{Math.min(scheduledOffset + 20, scheduledTotal)} dari {scheduledTotal}</p>
                <div className="flex gap-2">
                  <button disabled={scheduledOffset === 0} onClick={() => loadScheduled(scheduledOffset - 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">← Sebelumnya</button>
                  <button disabled={scheduledOffset + 20 >= scheduledTotal} onClick={() => loadScheduled(scheduledOffset + 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">Berikutnya →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: DIPROSES ═══ */}
      {activeTab === "diproses" && (
        <div data-tour="queue-tab-diproses-content" className="space-y-4">
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Flame className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Sedang & Selesai Diproses</h3>
            </div>

            {processedLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-sm font-medium">Memuat data...</span>
              </div>
            ) : processed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Flame className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">Tidak ada post yang sedang diproses</p>
              </div>
            ) : (
              <div className="space-y-2">
                {processed.map(post => {
                  const caption = post.caption || "";
                  const isProcessing = post.status === "processing";
                  return (
                    <div
                      key={post.postforme_id}
                      className={`group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border bg-white hover:shadow-sm transition-all ${isProcessing ? "border-amber-200 bg-amber-50/30" : "border-emerald-100"}`}
                    >
                      <div className="hidden sm:block w-1 self-stretch rounded-full shrink-0" style={{ background: isProcessing ? "#f59e0b" : "#10b981", minHeight: 40 }} />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isProcessing ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Loader2 className="w-3 h-3 animate-spin" /> Diproses...
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Selesai
                            </span>
                          )}
                          {post.targets && <PlatformTags targets={post.targets} />}
                        </div>
                        {caption ? (
                          <p className="text-sm text-slate-800 line-clamp-2 leading-snug font-medium">{caption}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Tidak ada caption</p>
                        )}
                        {post.published_at && (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Diterbitkan: {toWIB(post.published_at)}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono">ID: {post.postforme_id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {processedTotal > 20 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">{processedOffset + 1}–{Math.min(processedOffset + 20, processedTotal)} dari {processedTotal}</p>
                <div className="flex gap-2">
                  <button disabled={processedOffset === 0} onClick={() => loadProcessed(processedOffset - 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">← Sebelumnya</button>
                  <button disabled={processedOffset + 20 >= processedTotal} onClick={() => loadProcessed(processedOffset + 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">Berikutnya →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: RIWAYAT ═══ */}
      {activeTab === "riwayat" && (
        <div data-tour="queue-tab-riwayat-content" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl glass-card">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </div>
            <select
              value={filterPlatform}
              onChange={e => setFilterPlatform(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">Semua Platform</option>
              {["instagram", "facebook", "x", "tiktok", "youtube", "linkedin", "pinterest", "bluesky", "threads"].map(p => (
                <option key={p} value={p}>{PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterSuccess}
              onChange={e => setFilterSuccess(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">Semua Status</option>
              <option value="true">✅ Berhasil</option>
              <option value="false">❌ Gagal</option>
            </select>
            {(filterPlatform || filterSuccess) && (
              <button onClick={() => { setFilterPlatform(""); setFilterSuccess(""); }} className="px-3 py-2 text-xs rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium">Reset</button>
            )}
            <div className="ml-auto text-xs text-slate-400 font-medium">{historyMeta?.total ?? 0} total hasil</div>
          </div>

          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Riwayat Publikasi</h3>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-sm font-medium">Memuat riwayat...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <History className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">Belum ada riwayat publikasi</p>
                <p className="text-xs">Klik "Sync Riwayat" untuk mengambil hasil terbaru</p>
              </div>
            ) : (
              <div>
                {/* Mobile Cards */}
                <div className="block md:hidden space-y-3">
                  {history.map((r, idx) => {
                    const mediaUrl = r.media_urls?.[0];
                    const hasMedia = mediaUrl && !failedMedia[mediaUrl];
                    const vid = isVideo(mediaUrl);
                    return (
                      <div key={r.result_id || idx} className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            {r.avatar_url ? <img src={r.avatar_url} alt={r.username} className="w-6 h-6 rounded-full object-cover border border-slate-200" /> : <span>{PLATFORM_ICONS[r.platform] || "📱"}</span>}
                            <p className="font-bold text-slate-800 text-[11px]">@{r.username}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${PLATFORM_COLORS[r.platform] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{r.platform}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{r.result_at ? toWIB(r.result_at) : "-"}</span>
                        </div>
                        {r.post_caption && <p className="text-slate-700 text-xs line-clamp-2">{r.post_caption}</p>}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          {r.success === true ? (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Berhasil</span>
                          ) : r.success === false ? (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700"><XCircle className="w-3 h-3" /> Gagal</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Proses...</span>
                          )}
                          {r.platform_url && <a href={r.platform_url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline flex items-center gap-0.5 text-[11px]"><span>Lihat</span><ArrowUpRight className="w-3 h-3" /></a>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[680px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-3">Waktu (WIB)</th>
                        <th className="py-3 px-3">Platform & Akun</th>
                        <th className="py-3 px-3">Post</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((r, idx) => {
                        const mediaUrl = r.media_urls?.[0];
                        const hasMedia = mediaUrl && !failedMedia[mediaUrl];
                        const vid = isVideo(mediaUrl);
                        return (
                          <tr key={r.result_id || idx} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3.5 px-3">
                              <div className="text-[11px] text-slate-600 font-medium whitespace-nowrap">
                                {r.result_at ? toWIB(r.result_at) : "-"}
                              </div>
                              <div className="text-[10px] text-slate-400">{r.result_at ? toUTCLabel(r.result_at) : ""}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2">
                                {r.avatar_url ? <img src={r.avatar_url} alt={r.username} className="w-7 h-7 rounded-full object-cover border border-slate-200" /> : <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-base">{PLATFORM_ICONS[r.platform] || "📱"}</div>}
                                <div>
                                  <p className="font-bold text-slate-800 text-[11px]">@{r.username}</p>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${PLATFORM_COLORS[r.platform] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{r.platform}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 max-w-[220px]">
                              <div className="flex items-center gap-2">
                                {hasMedia && (vid ? (
                                  <button type="button" onClick={() => setPreviewMedia({ url: mediaUrl!, type: "video", caption: r.post_caption })} className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-900 text-white font-bold text-[10px] hover:bg-purple-800 shrink-0"><Play className="w-3 h-3 fill-white" /><span>Video</span></button>
                                ) : (
                                  <button type="button" onClick={() => setPreviewMedia({ url: mediaUrl!, type: "image", caption: r.post_caption })} className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:scale-105 transition-transform"><img src={mediaUrl} alt="thumb" className="w-full h-full object-cover" onError={() => setFailedMedia(p => ({ ...p, [mediaUrl!]: true }))} /></button>
                                ))}
                                <p className="text-slate-600 truncate text-[11px]">{r.post_caption || <span className="italic text-slate-400">Konten media</span>}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              {r.success === null || r.success === undefined ? (
                                <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-blue-100 text-blue-700 border border-blue-200 w-fit animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /><span>Proses...</span></span>
                              ) : r.success === true ? (
                                <span className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 w-fit"><CheckCircle2 className="w-3 h-3" /> Berhasil</span>
                              ) : (
                                <div>
                                  <span className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200 w-fit"><XCircle className="w-3 h-3" /> Gagal</span>
                                  {r.error_data && <p className="text-[10px] text-rose-500 mt-1 max-w-[160px] truncate">{typeof r.error_data === "string" ? r.error_data : JSON.stringify(r.error_data)}</p>}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              {r.platform_url ? <a href={r.platform_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"><ArrowUpRight className="w-3.5 h-3.5" /> Lihat Post</a> : <span className="text-[11px] text-slate-300">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(historyMeta?.total || 0) > 20 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">Menampilkan {historyOffset + 1}–{Math.min(historyOffset + 20, historyMeta.total)} dari {historyMeta.total}</p>
                <div className="flex gap-2">
                  <button disabled={historyOffset === 0} onClick={() => loadHistory(historyOffset - 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">← Sebelumnya</button>
                  <button disabled={historyOffset + 20 >= historyMeta.total} onClick={() => loadHistory(historyOffset + 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">Berikutnya →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <MediaPreviewModal
          url={previewMedia.url}
          type={previewMedia.type}
          caption={previewMedia.caption}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
}
