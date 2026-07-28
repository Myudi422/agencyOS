"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Cpu, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, RotateCcw, Trash2, History, ExternalLink,
  Zap, XCircle, ChevronRight, Filter, Search,
  ArrowUpRight, CreditCard, Loader2, Globe, Hourglass,
  Play, X, Eye, Video
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { confirmModal } from "@/store/useConfirmStore";
import { fetchApi } from "@/lib/api";

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

export default function QueuePage() {
  const { activeWorkspace } = useStore();
  const [activeTab, setActiveTab] = useState<"queue" | "history">("history");
  const [queueData, setQueueData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyMeta, setHistoryMeta] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>("");
  const [filterSuccess, setFilterSuccess] = useState<string>("");
  const [historyOffset, setHistoryOffset] = useState(0);

  // Media preview popup & error tracking
  const [previewMediaModal, setPreviewMediaModal] = useState<{
    url: string;
    type: "video" | "image";
    caption?: string;
  } | null>(null);
  const [failedMediaUrls, setFailedMediaUrls] = useState<Record<string, boolean>>({});

  const checkIsVideoMedia = (url?: string, postType?: string) => {
    if (!url) return false;
    if (postType === "video" || postType === "reel") return true;
    const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
    return (
      cleanUrl.startsWith("blob:") ||
      cleanUrl.includes("video") ||
      cleanUrl.includes("reels") ||
      /\.(mp4|mov|webm|avi|mkv|flv|m4v|3gp)(\?|$)/i.test(cleanUrl)
    );
  };

  const loadQueue = useCallback(() => {
    if (!activeWorkspace?.id) return;
    setIsLoading(true);
    fetchApi<any>(`/queue/?workspace_id=${activeWorkspace.id}`)
      .then((data) => { setQueueData(data); setIsLoading(false); })
      .catch(() => {
        setQueueData({ metrics: { pending: 0, processing: 0, retrying: 0, failed: 0, success: 0 }, jobs: [] });
        setIsLoading(false);
      });
  }, [activeWorkspace?.id]);

  const loadHistory = useCallback((offset = 0) => {
    if (!activeWorkspace?.id) return;
    setIsLoading(true);

    let url = `/queue/history?workspace_id=${activeWorkspace.id}&limit=20&offset=${offset}`;
    if (filterPlatform) url += `&platform=${filterPlatform}`;
    if (filterSuccess !== "") url += `&success=${filterSuccess === "true"}`;

    fetchApi<any>(url)
      .then((data) => {
        setHistoryData(data.data || []);
        setHistoryMeta(data.meta || {});
        setHistoryOffset(offset);
        setIsLoading(false);
      })
      .catch(() => {
        setHistoryData([]);
        setIsLoading(false);
      });
  }, [activeWorkspace?.id, filterPlatform, filterSuccess]);

  useEffect(() => {
    if (activeTab === "queue") loadQueue();
    else loadHistory(0);
  }, [activeWorkspace?.id, activeTab]);

  useEffect(() => {
    if (activeTab === "history") loadHistory(0);
  }, [filterPlatform, filterSuccess]);

  // Auto-refresh when there are processing items in history
  useEffect(() => {
    if (activeTab !== "history") return;
    const hasProcessing = historyData.some((r: any) => r.status === "processing" || r.success === null);
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      loadHistory(historyOffset);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, historyData, historyOffset]);

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
    } catch {
      toast.info(`Job ${jobId} requeued!`);
      loadQueue();
    }
  };

  const handleDeleteJob = (jobId: string) => {
    confirmModal({
      title: "Batalkan Queue Job",
      message: `Apakah Anda yakin ingin menghapus queue job ${jobId}?`,
      variant: "danger",
      confirmText: "Hapus Job",
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
            Queue & Riwayat Publikasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Pantau antrian publishing, riwayat hasil publikasi, dan status kredit per posting.
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
            onClick={() => activeTab === "queue" ? loadQueue() : loadHistory(historyOffset)}
            className="py-3 px-5 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 shadow-xs transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { key: "history", icon: History, label: "Riwayat Publikasi" },
          { key: "queue", icon: Cpu, label: "Proses (Queue Engine)" },
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

      {/* ─── TAB: RIWAYAT PUBLIKASI ─── */}
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
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Hasil Publikasi
              </h3>
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
                {/* 📱 Mobile Card View (shown only on small screens) */}
                <div className="block md:hidden space-y-3">
                  {historyData.map((r: any) => {
                    const mediaUrl = r.media_urls?.[0];
                    const hasValidMedia = mediaUrl && !failedMediaUrls[mediaUrl];
                    const isVid = checkIsVideoMedia(mediaUrl, r.post_type);

                    return (
                      <div key={r.result_id || Math.random()} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                        {/* Header: Platform & Time */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt={r.username} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <span className="text-sm">{PLATFORM_ICONS[r.platform] || "📱"}</span>
                            )}
                            <p className="font-bold text-slate-800 text-[11px]">@{r.username}</p>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold uppercase ${PLATFORM_COLORS[r.platform] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                              {r.platform}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {r.result_at ? new Date(r.result_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                          </span>
                        </div>

                        {/* Content & Media Snippet */}
                        <div className="flex items-start gap-2.5">
                          {hasValidMedia && (
                            isVid ? (
                              <button
                                type="button"
                                onClick={() => setPreviewMediaModal({ url: mediaUrl, type: "video", caption: r.post_caption })}
                                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-900 text-white font-bold text-[10px] hover:bg-purple-800 transition-all shrink-0 shadow-2xs border border-purple-400/30 cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-white" />
                                <span>Video</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPreviewMediaModal({ url: mediaUrl, type: "image", caption: r.post_caption })}
                                className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:scale-105 transition-transform"
                              >
                                <img
                                  src={mediaUrl}
                                  alt="thumb"
                                  className="w-full h-full object-cover"
                                  onError={() => setFailedMediaUrls(prev => ({ ...prev, [mediaUrl]: true }))}
                                />
                              </button>
                            )
                          )}
                          <p className="text-slate-700 text-xs leading-snug line-clamp-2">
                            {r.post_caption || <span className="italic text-slate-400">Konten media</span>}
                          </p>
                        </div>

                        {/* Footer: Status, Credit, Link */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          <div>
                            {r.status === "processing" || (r.success === null && r.result_id === null) ? (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> Proses...
                              </span>
                            ) : r.success === true ? (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" /> Berhasil
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700">
                                <XCircle className="w-3 h-3" /> Gagal
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {r.credit_deducted && (
                              <span className="font-bold text-purple-600 text-[10px] flex items-center gap-1">
                                <CreditCard className="w-3 h-3" /> -1
                              </span>
                            )}
                            {r.platform_url && (
                              <a
                                href={r.platform_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-blue-600 hover:underline flex items-center gap-0.5 text-[11px]"
                              >
                                <span>Lihat</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 🖥️ Desktop Table View (hidden on mobile, responsive scroll on desktop) */}
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
                          <tr key={r.result_id || Math.random()} className="hover:bg-purple-50/30 transition-colors group">
                            {/* Waktu */}
                            <td className="py-3.5 px-3">
                              <div className="text-[11px] text-slate-600 font-medium whitespace-nowrap">
                                {r.result_at ? new Date(r.result_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {r.result_at ? new Date(r.result_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                              </div>
                            </td>

                            {/* Platform & Akun */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2">
                                {r.avatar_url ? (
                                  <img src={r.avatar_url} alt={r.username} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-base">
                                    {PLATFORM_ICONS[r.platform] || "📱"}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-800 text-[11px]">@{r.username}</p>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${PLATFORM_COLORS[r.platform] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                    {r.platform}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Post Snippet & Media */}
                            <td className="py-3.5 px-3 max-w-[220px]">
                              <div className="flex items-center gap-2">
                                {hasValidMedia && (
                                  isVid ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewMediaModal({ url: mediaUrl, type: "video", caption: r.post_caption })}
                                      className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-900 text-white font-bold text-[10px] hover:bg-purple-800 hover:scale-105 transition-all border border-purple-400/40 shrink-0 cursor-pointer shadow-2xs group/vid"
                                      title="Klik untuk memutar video"
                                    >
                                      <Play className="w-3 h-3 fill-white text-white group-hover/vid:scale-110 transition-transform" />
                                      <span>Video</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewMediaModal({ url: mediaUrl, type: "image", caption: r.post_caption })}
                                      className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:scale-105 transition-transform"
                                      title="Klik untuk memperbesar gambar"
                                    >
                                      <img
                                        src={mediaUrl}
                                        alt="thumb"
                                        className="w-full h-full object-cover"
                                        onError={() => setFailedMediaUrls(prev => ({ ...prev, [mediaUrl]: true }))}
                                      />
                                    </button>
                                  )
                                )}
                                <p className="text-slate-600 truncate text-[11px] leading-tight">
                                  {r.post_caption || <span className="italic text-slate-400">Konten media</span>}
                                </p>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-3">
                              {r.status === "processing" || (r.success === null && r.result_id === null) ? (
                                <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-blue-100 text-blue-700 border border-blue-200 w-fit whitespace-nowrap animate-pulse">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Proses...</span>
                                </span>
                              ) : r.success === true ? (
                                <span className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 w-fit whitespace-nowrap">
                                  <CheckCircle2 className="w-3 h-3" /> Berhasil
                                </span>
                              ) : r.success === false ? (
                                <div>
                                  <span className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200 w-fit whitespace-nowrap">
                                    <XCircle className="w-3 h-3" /> Gagal
                                  </span>
                                  {r.error_data && (
                                    <p className="text-[10px] text-rose-500 mt-1 max-w-[160px] truncate" title={JSON.stringify(r.error_data)}>
                                      {typeof r.error_data === "string" ? r.error_data : JSON.stringify(r.error_data)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full font-bold bg-amber-100 text-amber-700 border border-amber-200 w-fit whitespace-nowrap">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </td>

                            {/* Kredit */}
                            <td className="py-3.5 px-3">
                              {r.credit_deducted ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 whitespace-nowrap">
                                  <CreditCard className="w-3 h-3" /> -1 kredit
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">—</span>
                              )}
                            </td>

                            {/* Link */}
                            <td className="py-3.5 px-3">
                              {r.platform_url ? (
                                <a
                                  href={r.platform_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" /> Lihat Post
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-300 font-medium">—</span>
                              )}
                            </td>
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
                  <button
                    disabled={historyOffset === 0}
                    onClick={() => loadHistory(historyOffset - 20)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    disabled={historyOffset + 20 >= historyMeta.total}
                    onClick={() => loadHistory(historyOffset + 20)}
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

      {/* ─── TAB: QUEUE ENGINE ─── */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: "Pending", val: metrics.pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              { label: "Processing", val: metrics.processing, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
              { label: "Retrying", val: metrics.retrying, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
              { label: "Failed", val: metrics.failed, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
              { label: "Success", val: metrics.success, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" }
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
                  {(queueData?.jobs || []).length === 0 ? (
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
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-bold">{j.attempts} / {j.max_attempts}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {(j.status === "retrying" || j.status === "failed") && (
                          <button
                            onClick={() => handleRetryJob(j.job_id)}
                            className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteJob(j.job_id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Queue Job"
                        >
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

      {/* ─── MEDIA PREVIEW POPUP MODAL ─── */}
      {previewMediaModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                {previewMediaModal.type === "video" ? (
                  <Video className="w-4 h-4 text-purple-400" />
                ) : (
                  <Eye className="w-4 h-4 text-purple-400" />
                )}
                <span>{previewMediaModal.type === "video" ? "Pratinjau Video Post" : "Pratinjau Gambar Post"}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content View */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[280px] sm:min-h-[380px] overflow-hidden">
              {previewMediaModal.type === "video" ? (
                <video
                  src={previewMediaModal.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[60vh] w-full object-contain"
                  onError={() => {
                    toast.error("Video tidak dapat diputar atau URL expired.");
                    setFailedMediaUrls(prev => ({ ...prev, [previewMediaModal.url]: true }));
                    setPreviewMediaModal(null);
                  }}
                />
              ) : (
                <img
                  src={previewMediaModal.url}
                  alt="Preview"
                  className="max-h-[60vh] w-full object-contain"
                  onError={() => {
                    toast.error("Gambar tidak dapat dimuat.");
                    setFailedMediaUrls(prev => ({ ...prev, [previewMediaModal.url]: true }));
                    setPreviewMediaModal(null);
                  }}
                />
              )}
            </div>

            {/* Caption Footer */}
            {previewMediaModal.caption && (
              <div className="p-4 bg-slate-900 text-slate-300 text-xs border-t border-slate-800 max-h-24 overflow-y-auto leading-relaxed">
                <p className="font-semibold text-slate-400 text-[10px] uppercase mb-1">Caption:</p>
                <p>{previewMediaModal.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
