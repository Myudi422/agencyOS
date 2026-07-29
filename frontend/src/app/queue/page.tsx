"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Cpu, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, RotateCcw, Trash2, History, ExternalLink,
  Zap, XCircle, ChevronRight, Filter, Search,
  ArrowUpRight, CreditCard, Loader2, Globe, Hourglass,
  Play, X, Eye, Video, FileText, Calendar, Edit3,
  Send, CalendarClock, ChevronDown, MoreHorizontal,
  PenLine, ClipboardList
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { confirmModal } from "@/store/useConfirmStore";
import { fetchApi } from "@/lib/api";

/* ─── Types ─── */
type PostStatus = "draft" | "scheduled" | "processing" | "processed";

interface SocialPost {
  id: string;
  workspace_id: string;
  title?: string;
  status: PostStatus;
  content?: { text?: string };
  caption?: string;           // flat field (also returned by backend)
  platforms?: string[];
  targets?: { target_id?: string; account_id?: string; platform: string; username: string; avatar_url?: string }[];
  scheduled_at?: string;
  updated_at: string;
  created_at?: string;
  media_urls?: string[];
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

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  draft: {
    label: "Draft",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    icon: <PenLine className="w-3 h-3" />,
  },
  scheduled: {
    label: "Dijadwalkan",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <CalendarClock className="w-3 h-3" />,
  },
  processing: {
    label: "Diproses",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  processed: {
    label: "Selesai",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

/* ─── Post Status Badge ─── */
function StatusBadge({ status }: { status: PostStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border} whitespace-nowrap`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ─── Post Edit/Process Modal ─── */
function PostModal({
  post,
  mode,
  onClose,
  onSave,
}: {
  post: SocialPost;
  mode: "edit" | "schedule";
  onClose: () => void;
  onSave: (updated: Partial<SocialPost>) => Promise<void>;
}) {
  const [text, setText] = useState(post.content?.text || post.caption || "");
  const [scheduledAt, setScheduledAt] = useState(
    post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<SocialPost> = {};
      if (mode === "edit") {
        payload.content = { text };
        payload.status = "draft";
      } else {
        payload.scheduled_at = scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
        payload.status = "scheduled";
      }
      await onSave(payload);
      onClose();
    } catch {
      toast.error("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {mode === "edit" ? (
              <Edit3 className="w-4 h-4 text-purple-600" />
            ) : (
              <CalendarClock className="w-4 h-4 text-blue-600" />
            )}
            <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {mode === "edit" ? "Edit Draft" : "Jadwalkan Post"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Post ID Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">ID: {post.id.slice(0, 12)}...</span>
            <StatusBadge status={post.status} />
          </div>

          {mode === "edit" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Konten / Caption</label>
              <textarea
                ref={textRef}
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-2xl text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 resize-none"
                style={{ focusRingColor: "#7c3aed" } as React.CSSProperties}
                placeholder="Tulis caption atau konten postingan..."
              />
              <p className="text-[10px] text-slate-400 mt-1">{text.length} karakter</p>
            </div>
          )}

          {mode === "schedule" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Waktu Tayang</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#7c3aed" } as React.CSSProperties}
                min={new Date().toISOString().slice(0, 16)}
              />
              {post.scheduled_at && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Jadwal saat ini:{" "}
                  {new Date(post.scheduled_at).toLocaleString("id-ID", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              )}
            </div>
          )}

          {/* Platforms */}
          {post.platforms && post.platforms.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-2">Platform Target</p>
              <div className="flex flex-wrap gap-1.5">
                {post.platforms.map(p => (
                  <span
                    key={p}
                    className={`text-[10px] px-2 py-1 rounded-full border font-bold ${PLATFORM_COLORS[p] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    {PLATFORM_ICONS[p]} {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (mode === "schedule" && !scheduledAt)}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60 transition-all"
            style={{ background: "#7c3aed" }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {mode === "edit" ? "Simpan Draft" : "Jadwalkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Queue Page ─── */
export default function QueuePage() {
  const { activeWorkspace, openComposer } = useStore();

  // Tabs: posts | queue | history
  const [activeTab, setActiveTab] = useState<"posts" | "queue" | "history">("posts");

  // ─── POSTS TAB state ───
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsOffset, setPostsOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState<PostStatus | "">("");
  const [filterPlatformPost, setFilterPlatformPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalPost, setModalPost] = useState<{ post: SocialPost; mode: "edit" | "schedule" } | null>(null);

  // ─── QUEUE TAB state ───
  const [queueData, setQueueData] = useState<any>(null);

  // ─── HISTORY TAB state ───
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyMeta, setHistoryMeta] = useState<any>({});
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterSuccess, setFilterSuccess] = useState("");
  const [historyOffset, setHistoryOffset] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Media preview
  const [previewMediaModal, setPreviewMediaModal] = useState<{
    url: string; type: "video" | "image"; caption?: string;
  } | null>(null);
  const [failedMediaUrls, setFailedMediaUrls] = useState<Record<string, boolean>>({});

  const checkIsVideoMedia = (url?: string, postType?: string) => {
    if (!url) return false;
    if (postType === "video" || postType === "reel") return true;
    const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
    return (
      cleanUrl.startsWith("blob:") || cleanUrl.includes("video") ||
      /\.(mp4|mov|webm|avi|mkv|flv|m4v|3gp)(\?|$)/i.test(cleanUrl)
    );
  };

  /* ─── Load Social Posts ─── */
  const loadPosts = useCallback(async (offset = 0) => {
    if (!activeWorkspace?.id) return;
    setPostsLoading(true);
    try {
      // Uses /posts/ endpoint (backend native) which now returns { data, total, limit, offset }
      let url = `/posts/?workspace_id=${activeWorkspace.id}&limit=20&offset=${offset}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterPlatformPost) url += `&platform=${filterPlatformPost}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      const data = await fetchApi<any>(url);
      // Backend returns { data: [...], total: N } envelope
      const items = Array.isArray(data) ? data : (data?.data ?? []);
      setPosts(items);
      setPostsTotal(typeof data?.total === "number" ? data.total : items.length);
      setPostsOffset(offset);
    } catch {
      setPosts([]);
      setPostsTotal(0);
    } finally {
      setPostsLoading(false);
    }
  }, [activeWorkspace?.id, filterStatus, filterPlatformPost, searchQuery]);

  /* ─── Load Queue ─── */
  const loadQueue = useCallback(() => {
    if (!activeWorkspace?.id) return;
    setIsLoading(true);
    fetchApi<any>(`/queue/?workspace_id=${activeWorkspace.id}`)
      .then(data => { setQueueData(data); setIsLoading(false); })
      .catch(() => {
        setQueueData({ metrics: { pending: 0, processing: 0, retrying: 0, failed: 0, success: 0 }, jobs: [] });
        setIsLoading(false);
      });
  }, [activeWorkspace?.id]);

  /* ─── Load History ─── */
  const loadHistory = useCallback((offset = 0) => {
    if (!activeWorkspace?.id) return;
    setIsLoading(true);
    let url = `/queue/history?workspace_id=${activeWorkspace.id}&limit=20&offset=${offset}`;
    if (filterPlatform) url += `&platform=${filterPlatform}`;
    if (filterSuccess !== "") url += `&success=${filterSuccess === "true"}`;
    fetchApi<any>(url)
      .then(data => {
        setHistoryData(data.data || []);
        setHistoryMeta(data.meta || {});
        setHistoryOffset(offset);
        setIsLoading(false);
      })
      .catch(() => { setHistoryData([]); setIsLoading(false); });
  }, [activeWorkspace?.id, filterPlatform, filterSuccess]);

  /* ─── Effects ─── */
  useEffect(() => {
    if (activeTab === "posts") loadPosts(0);
    else if (activeTab === "queue") loadQueue();
    else loadHistory(0);
  }, [activeWorkspace?.id, activeTab]);

  useEffect(() => {
    if (activeTab === "posts") loadPosts(0);
  }, [filterStatus, filterPlatformPost]);

  useEffect(() => {
    if (activeTab === "history") loadHistory(0);
  }, [filterPlatform, filterSuccess]);

  // Auto-refresh processing
  useEffect(() => {
    if (activeTab !== "posts") return;
    const hasProcessing = posts.some(p => p.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(() => loadPosts(postsOffset), 5000);
    return () => clearInterval(interval);
  }, [activeTab, posts, postsOffset]);

  useEffect(() => {
    if (activeTab !== "history") return;
    const hasProcessing = historyData.some((r: any) => r.status === "processing" || r.success === null);
    if (!hasProcessing) return;
    const interval = setInterval(() => loadHistory(historyOffset), 5000);
    return () => clearInterval(interval);
  }, [activeTab, historyData, historyOffset]);

  /* ─── Post Actions ─── */
  const handleUpdatePost = async (postId: string, payload: Partial<SocialPost>) => {
    // Build PATCH body: map content.text back to caption if needed
    const body: Record<string, any> = {};
    if (payload.content?.text !== undefined) body.caption = payload.content.text;
    if (payload.scheduled_at !== undefined) body.scheduled_at = payload.scheduled_at;
    if (payload.status !== undefined) body.status = payload.status;

    await fetchApi(`/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    toast.success("Post berhasil diperbarui!");
    loadPosts(postsOffset);
  };

  const handleDeletePost = (postId: string) => {
    confirmModal({
      title: "Hapus Post",
      message: "Apakah kamu yakin ingin menghapus post ini?",
      variant: "danger",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await fetchApi(`/posts/${postId}`, { method: "DELETE" });
          toast.success("Post dihapus.");
          loadPosts(postsOffset);
        } catch {
          toast.error("Gagal menghapus post.");
        }
      },
    });
  };

  /* ─── Queue Actions ─── */
  const handleSyncResults = async () => {
    if (!activeWorkspace?.id) return;
    setIsSyncing(true);
    try {
      await fetchApi(`/queue/sync-results?workspace_id=${activeWorkspace.id}`, { method: "POST" });
      toast.success("Sinkronisasi dimulai! Hasil akan diperbarui sebentar lagi.");
      setTimeout(() => { loadHistory(0); setIsSyncing(false); }, 3000);
    } catch {
      toast.error("Gagal sinkronisasi.");
      setIsSyncing(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await fetchApi(`/queue/retry/${jobId}`, { method: "POST" });
      toast.success(`Job ${jobId} dikembalikan ke antrian!`);
      loadQueue();
    } catch { toast.info(`Job ${jobId} requeued!`); loadQueue(); }
  };

  const handleDeleteJob = (jobId: string) => {
    confirmModal({
      title: "Batalkan Queue Job",
      message: `Apakah Anda yakin ingin menghapus queue job ${jobId}?`,
      variant: "danger", confirmText: "Hapus Job",
      onConfirm: async () => {
        try {
          await fetchApi(`/queue/${jobId}`, { method: "DELETE" });
          toast.success(`Queue job ${jobId} dihapus.`);
          setQueueData((prev: any) => ({
            ...prev,
            jobs: (prev?.jobs || []).filter((j: any) => j.job_id !== jobId)
          }));
        } catch {
          setQueueData((prev: any) => ({
            ...prev,
            jobs: (prev?.jobs || []).filter((j: any) => j.job_id !== jobId)
          }));
        }
      },
    });
  };

  const metrics = queueData?.metrics || { pending: 0, processing: 0, retrying: 0, failed: 0, success: 0 };

  /* ─── Status tab counts (from current posts) ─── */
  const statusCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200">
              Publishing Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Manage Posts & Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Kelola draft, jadwal tayang, antrian proses, dan riwayat publikasi konten kamu.
          </p>
        </div>
        <div className="flex items-center gap-2 z-10 flex-wrap">
          {activeTab === "history" && (
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
            onClick={() => {
              if (activeTab === "posts") loadPosts(postsOffset);
              else if (activeTab === "queue") loadQueue();
              else loadHistory(historyOffset);
            }}
            className="py-3 px-5 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 shadow-xs transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || postsLoading ? "animate-spin text-purple-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit flex-wrap">
        {[
          { key: "posts", icon: ClipboardList, label: "Semua Post" },
          { key: "queue", icon: Cpu, label: "Queue Engine" },
          { key: "history", icon: History, label: "Riwayat" },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB: SEMUA POST ═══════════════ */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          {/* Status quick-filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(["", "draft", "scheduled", "processing", "processed"] as const).map(s => {
              const isActive = filterStatus === s;
              const cfg = s ? STATUS_CONFIG[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isActive
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-700"
                  }`}
                >
                  {s === "" ? "Semua" : cfg!.label}
                  {s !== "" && (
                    <span className="ml-1.5 opacity-70">{statusCounts[s] ?? ""}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Platform filter row */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl glass-card">
            <div className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-purple-300">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadPosts(0)}
                placeholder="Cari judul atau konten..."
                className="flex-1 text-xs bg-transparent text-slate-700 outline-none placeholder-slate-400"
              />
            </div>
            <select
              value={filterPlatformPost}
              onChange={e => setFilterPlatformPost(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">Semua Platform</option>
              {["instagram", "facebook", "x", "tiktok", "youtube", "linkedin", "pinterest", "bluesky", "threads"].map(p => (
                <option key={p} value={p}>{PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            {(filterStatus || filterPlatformPost || searchQuery) && (
              <button
                onClick={() => { setFilterStatus(""); setFilterPlatformPost(""); setSearchQuery(""); }}
                className="px-3 py-2 text-xs rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
              >
                Reset
              </button>
            )}
            <div className="ml-auto text-xs text-slate-400 font-medium">{postsTotal} post</div>
          </div>

          {/* Posts List */}
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ClipboardList className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Daftar Post</h3>
            </div>

            {postsLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-sm font-medium">Memuat post...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <ClipboardList className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">Belum ada post ditemukan</p>
                <p className="text-xs">Coba ubah filter atau buat post baru</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map(post => {
                  const isDraft = post.status === "draft";
                  const isScheduled = post.status === "scheduled";
                  const isProcessing = post.status === "processing";
                  const isProcessed = post.status === "processed";
                  const caption = post.content?.text || post.caption || "";

                  return (
                    <div
                      key={post.id}
                      className={`group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border bg-white transition-all hover:shadow-sm hover:border-purple-200 ${
                        isProcessing ? "border-amber-200 bg-amber-50/30" : "border-slate-100"
                      }`}
                    >
                      {/* Status strip */}
                      <div
                        className="hidden sm:block w-1 h-full self-stretch rounded-full shrink-0"
                        style={{
                          background: isDraft ? "#94a3b8" : isScheduled ? "#3b82f6" : isProcessing ? "#f59e0b" : "#10b981",
                          minHeight: 40,
                        }}
                      />

                      {/* Main info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={post.status} />
                          {post.platforms?.slice(0, 4).map(p => (
                            <span
                              key={p}
                              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${PLATFORM_COLORS[p] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                            >
                              {PLATFORM_ICONS[p]} {p}
                            </span>
                          ))}
                        </div>
                        {caption ? (
                          <p className="text-sm text-slate-800 line-clamp-2 leading-snug font-medium">{caption}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Tidak ada caption</p>
                        )}
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                          <span>ID: {post.id.slice(0, 8)}...</span>
                          {isScheduled && post.scheduled_at && (
                            <span className="text-blue-600 font-semibold flex items-center gap-1">
                              <CalendarClock className="w-3 h-3" />
                              Tayang:{" "}
                              {new Date(post.scheduled_at).toLocaleString("id-ID", {
                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          )}
                          <span>
                            Diperbarui:{" "}
                            {new Date(post.updated_at).toLocaleDateString("id-ID", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Draft or Scheduled → Edit in Shiera Post Composer */}
                        {(isDraft || isScheduled) && (
                          <button
                            onClick={() => openComposer(post.targets?.map(t => t.account_id).filter((id): id is string => Boolean(id)) || [], post)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            {isDraft ? "Edit & Proses di Composer" : "Edit di Composer"}
                          </button>
                        )}
                        {/* Processing indicator */}
                        {isProcessing && (
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Sedang diproses...
                          </span>
                        )}
                        {/* Delete */}
                        {!isProcessing && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {postsTotal > 20 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  {postsOffset + 1}–{Math.min(postsOffset + 20, postsTotal)} dari {postsTotal}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={postsOffset === 0}
                    onClick={() => loadPosts(postsOffset - 20)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    disabled={postsOffset + 20 >= postsTotal}
                    onClick={() => loadPosts(postsOffset + 20)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: RIWAYAT PUBLIKASI ═══════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl glass-card">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              Filter:
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
              <button
                onClick={() => { setFilterPlatform(""); setFilterSuccess(""); }}
                className="px-3 py-2 text-xs rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
              >
                Reset Filter
              </button>
            )}
            <div className="ml-auto text-xs text-slate-400 font-medium">
              {historyMeta.total ?? 0} total hasil
            </div>
          </div>

          {/* History Table */}
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Hasil Publikasi</h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-sm font-medium">Memuat riwayat...</span>
              </div>
            ) : historyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <History className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">Belum ada riwayat publikasi</p>
                <p className="text-xs text-slate-400">Klik "Sync Riwayat" untuk mengambil hasil terbaru</p>
              </div>
            ) : (
              <div>
                {/* Mobile Card */}
                <div className="block md:hidden space-y-3">
                  {historyData.map((r: any) => {
                    const mediaUrl = r.media_urls?.[0];
                    const hasValidMedia = mediaUrl && !failedMediaUrls[mediaUrl];
                    const isVid = checkIsVideoMedia(mediaUrl, r.post_type);
                    return (
                      <div key={r.result_id || Math.random()} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt={r.username} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <span className="text-sm">{PLATFORM_ICONS[r.platform] || "📱"}</span>
                            )}
                            <p className="font-bold text-slate-800 text-[11px]">@{r.username}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${PLATFORM_COLORS[r.platform] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{r.platform}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {r.result_at ? new Date(r.result_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          {hasValidMedia && (isVid ? (
                            <button type="button" onClick={() => setPreviewMediaModal({ url: mediaUrl, type: "video", caption: r.post_caption })} className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-900 text-white font-bold text-[10px] hover:bg-purple-800 transition-all shrink-0">
                              <Play className="w-3 h-3 fill-white" /><span>Video</span>
                            </button>
                          ) : (
                            <button type="button" onClick={() => setPreviewMediaModal({ url: mediaUrl, type: "image", caption: r.post_caption })} className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:scale-105 transition-transform">
                              <img src={mediaUrl} alt="thumb" className="w-full h-full object-cover" onError={() => setFailedMediaUrls(prev => ({ ...prev, [mediaUrl]: true }))} />
                            </button>
                          ))}
                          <p className="text-slate-700 text-xs leading-snug line-clamp-2">{r.post_caption || <span className="italic text-slate-400">Konten media</span>}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          <div>
                            {r.status === "processing" || (r.success === null && r.result_id === null) ? (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Proses...</span>
                            ) : r.success === true ? (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Berhasil</span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700"><XCircle className="w-3 h-3" /> Gagal</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {r.credit_deducted && <span className="font-bold text-purple-600 text-[10px] flex items-center gap-1"><CreditCard className="w-3 h-3" /> -1</span>}
                            {r.platform_url && <a href={r.platform_url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline flex items-center gap-0.5 text-[11px]"><span>Lihat</span><ArrowUpRight className="w-3 h-3" /></a>}
                          </div>
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
                        <th className="py-3 px-3">Waktu</th>
                        <th className="py-3 px-3">Platform & Akun</th>
                        <th className="py-3 px-3">Post & Media</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Kredit</th>
                        <th className="py-3 px-3">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyData.map((r: any) => {
                        const mediaUrl = r.media_urls?.[0];
                        const hasValidMedia = mediaUrl && !failedMediaUrls[mediaUrl];
                        const isVid = checkIsVideoMedia(mediaUrl, r.post_type);
                        return (
                          <tr key={r.result_id || Math.random()} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3.5 px-3">
                              <div className="text-[11px] text-slate-600 font-medium whitespace-nowrap">{r.result_at ? new Date(r.result_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}</div>
                              <div className="text-[10px] text-slate-400">{r.result_at ? new Date(r.result_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
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
                                {hasValidMedia && (isVid ? (
                                  <button type="button" onClick={() => setPreviewMediaModal({ url: mediaUrl, type: "video", caption: r.post_caption })} className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-900 text-white font-bold text-[10px] hover:bg-purple-800 transition-all border border-purple-400/40 shrink-0"><Play className="w-3 h-3 fill-white" /><span>Video</span></button>
                                ) : (
                                  <button type="button" onClick={() => setPreviewMediaModal({ url: mediaUrl, type: "image", caption: r.post_caption })} className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:scale-105 transition-transform"><img src={mediaUrl} alt="thumb" className="w-full h-full object-cover" onError={() => setFailedMediaUrls(prev => ({ ...prev, [mediaUrl]: true }))} /></button>
                                ))}
                                <p className="text-slate-600 truncate text-[11px]">{r.post_caption || <span className="italic text-slate-400">Konten media</span>}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              {r.status === "processing" || (r.success === null && r.result_id === null) ? (
                                <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-blue-100 text-blue-700 border border-blue-200 w-fit animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /><span>Proses...</span></span>
                              ) : r.success === true ? (
                                <span className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 w-fit"><CheckCircle2 className="w-3 h-3" /> Berhasil</span>
                              ) : r.success === false ? (
                                <div><span className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200 w-fit"><XCircle className="w-3 h-3" /> Gagal</span>{r.error_data && <p className="text-[10px] text-rose-500 mt-1 max-w-[160px] truncate">{typeof r.error_data === "string" ? r.error_data : JSON.stringify(r.error_data)}</p>}</div>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-amber-100 text-amber-700 border border-amber-200 w-fit"><Clock className="w-3 h-3" /> Pending</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">{r.credit_deducted ? <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 whitespace-nowrap"><CreditCard className="w-3 h-3" /> -1 kredit</span> : <span className="text-[11px] text-slate-400 font-medium">—</span>}</td>
                            <td className="py-3.5 px-3">{r.platform_url ? <a href={r.platform_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"><ArrowUpRight className="w-3.5 h-3.5" /> Lihat Post</a> : <span className="text-[11px] text-slate-300 font-medium">—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {historyMeta.total > 20 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Menampilkan {historyOffset + 1}–{Math.min(historyOffset + 20, historyMeta.total)} dari {historyMeta.total}
                </p>
                <div className="flex gap-2">
                  <button disabled={historyOffset === 0} onClick={() => loadHistory(historyOffset - 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors">← Sebelumnya</button>
                  <button disabled={historyOffset + 20 >= historyMeta.total} onClick={() => loadHistory(historyOffset + 20)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors">Berikutnya →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: QUEUE ENGINE ═══════════════ */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: "Pending", val: metrics.pending, color: "text-amber-600" },
              { label: "Processing", val: metrics.processing, color: "text-blue-600" },
              { label: "Retrying", val: metrics.retrying, color: "text-purple-600" },
              { label: "Failed", val: metrics.failed, color: "text-rose-600" },
              { label: "Success", val: metrics.success, color: "text-emerald-600" },
            ].map((m, i) => (
              <div key={i} className="p-4 rounded-2xl glass-card text-center space-y-1">
                <p className="text-[11px] text-slate-500 font-semibold">{m.label}</p>
                <p className={`text-xl sm:text-2xl font-extrabold font-['Outfit'] ${m.color}`}>{m.val}</p>
              </div>
            ))}
          </div>

          {/* Job Table */}
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>Active Job Queue Stream</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Job ID</th>
                    <th className="py-3 px-4">Target Channel</th>
                    <th className="py-3 px-4">Post Snippet</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-purple-500" /></td></tr>
                  ) : (queueData?.jobs || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">
                        <Cpu className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>Tidak ada job aktif</p>
                      </td>
                    </tr>
                  ) : (queueData?.jobs || []).map((j: any) => (
                    <tr key={j.job_id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{j.job_id.slice(0, 8)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">@{j.username}</span>
                        <span className="ml-2 text-[10px] text-slate-400">{PLATFORM_ICONS[j.platform] || "📱"} {j.platform}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[220px]">{j.post_caption}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                          j.status === "success" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                          j.status === "processing" ? "bg-blue-100 text-blue-700 border border-blue-200 animate-pulse" :
                          j.status === "retrying" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                          j.status === "failed" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                          "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}>{j.status}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-bold">{j.attempts} / {j.max_attempts}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {(j.status === "retrying" || j.status === "failed") && (
                          <button onClick={() => handleRetryJob(j.job_id)} className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors">
                            <RotateCcw className="w-3 h-3" /><span>Retry</span>
                          </button>
                        )}
                        <button onClick={() => handleDeleteJob(j.job_id)} className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete Queue Job">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MEDIA PREVIEW MODAL ═══════════════ */}
      {previewMediaModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                {previewMediaModal.type === "video" ? <Video className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-purple-400" />}
                <span>{previewMediaModal.type === "video" ? "Pratinjau Video" : "Pratinjau Gambar"}</span>
              </div>
              <button type="button" onClick={() => setPreviewMediaModal(null)} className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[280px] sm:min-h-[380px] overflow-hidden">
              {previewMediaModal.type === "video" ? (
                <video src={previewMediaModal.url} controls autoPlay playsInline className="max-h-[60vh] w-full object-contain" onError={() => { toast.error("Video tidak dapat diputar."); setPreviewMediaModal(null); }} />
              ) : (
                <img src={previewMediaModal.url} alt="Preview" className="max-h-[60vh] w-full object-contain" onError={() => { toast.error("Gambar tidak dapat dimuat."); setPreviewMediaModal(null); }} />
              )}
            </div>
            {previewMediaModal.caption && (
              <div className="p-4 bg-slate-900 text-slate-300 text-xs border-t border-slate-800 max-h-24 overflow-y-auto leading-relaxed">
                <p className="font-semibold text-slate-400 text-[10px] uppercase mb-1">Caption:</p>
                <p>{previewMediaModal.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ POST EDIT/SCHEDULE MODAL ═══════════════ */}
      {modalPost && (
        <PostModal
          post={modalPost.post}
          mode={modalPost.mode}
          onClose={() => setModalPost(null)}
          onSave={(payload) => handleUpdatePost(modalPost.post.id, payload)}
        />
      )}
    </div>
  );
}
