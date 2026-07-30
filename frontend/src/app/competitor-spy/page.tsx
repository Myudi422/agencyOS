"use client";

import React, { useState, useEffect } from "react";
import {
  Target, Plus, RefreshCw, Trash2, ExternalLink, Flame, Search,
  TrendingUp, Users, Heart, MessageSquare, Award, Sparkles,
  BarChart3, CheckCircle2, AlertCircle, Eye, ArrowUpRight, Copy,
  Grid, ListFilter, ShieldCheck, Instagram, ChevronRight, X
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { useSplashStore } from "@/store/useSplashStore";

interface Competitor {
  id: string;
  workspace_id: string;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
  biography?: string;
  followers_count: number;
  following_count: number;
  media_count: number;
  is_verified: boolean;
  category_name?: string;

  avg_likes: number;
  avg_comments: number;
  engagement_rate: number;
  top_hashtags: string[];
  last_synced_at?: string;
  created_at: string;
  posts_count: number;
}

interface CompetitorPost {
  id: string;
  competitor_id: string;
  instagram_media_id: string;
  code?: string;
  post_type: string;
  caption?: string;
  thumbnail_url?: string;
  media_urls: string[];
  like_count: number;
  comment_count: number;
  engagement_rate: number;
  is_top_performer: boolean;
  posted_at?: string;
  instagram_url?: string;
}

type ActiveTab = "accounts" | "feed" | "benchmark";

export default function CompetitorSpyPage() {
  const { activeWorkspace, openComposer } = useStore();
  const { showSplash } = useSplashStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("accounts");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Competitor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Syncing state per competitor ID
  const [syncingMap, setSyncingMap] = useState<Record<string, boolean>>({});

  // Selected competitor for Post Detail modal
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [competitorPosts, setCompetitorPosts] = useState<CompetitorPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [filterTopOnly, setFilterTopOnly] = useState(false);

  // Benchmark matrix state
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  // Toast message
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadCompetitors();
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeTab === "benchmark") {
      loadBenchmark();
    }
  }, [activeTab]);

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCompetitors = async () => {
    setLoading(true);
    try {
      const data: any = await fetchApi("/competitors/");
      setCompetitors(data.competitors || []);
    } catch (e: any) {
      showToast("err", "Gagal memuat daftar kompetitor.");
    } finally {
      setLoading(false);
    }
  };

  const loadBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const data: any = await fetchApi("/competitors/benchmark/matrix");
      setBenchmarkData(data);
    } catch (e: any) {
      showToast("err", "Gagal memuat matrix benchmark.");
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setAddLoading(true);
    setAddError(null);
    try {
      const res: any = await fetchApi("/competitors/", {
        method: "POST",
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      showToast("ok", res.message || `Kompetitor @${newUsername} berhasil ditambahkan!`);
      setNewUsername("");
      setIsAddModalOpen(false);
      loadCompetitors();
    } catch (e: any) {
      const msg = e.message || "Terjadi kesalahan saat menambahkan kompetitor.";
      setAddError(msg.includes("INSTAGRAM_SESSION_COOKIE")
        ? "Instagram Session Cookie belum diatur di Admin Settings. Harap minta Admin mengisinya di /admin."
        : msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleSyncCompetitor = async (id: string, username: string) => {
    setSyncingMap((prev) => ({ ...prev, [id]: true }));
    try {
      const res: any = await fetchApi(`/competitors/${id}/sync`, { method: "POST" });
      showToast("ok", res.message || `Data @${username} berhasil diperbarui!`);
      loadCompetitors();
      if (selectedCompetitor?.id === id) {
        loadCompetitorPosts(id, filterTopOnly);
      }
    } catch (e: any) {
      showToast("err", `Sync gagal untuk @${username}: ${e.message}`);
    } finally {
      setSyncingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteCompetitor = async (id: string, username: string) => {
    if (!confirm(`Hapus @${username} dari daftar pantau kompetitor?`)) return;

    try {
      await fetchApi(`/competitors/${id}`, { method: "DELETE" });
      showToast("ok", `Kompetitor @${username} dihapus.`);
      if (selectedCompetitor?.id === id) setSelectedCompetitor(null);
      loadCompetitors();
    } catch (e: any) {
      showToast("err", "Gagal menghapus kompetitor.");
    }
  };

  const loadCompetitorPosts = async (id: string, topOnly: boolean = false) => {
    setPostsLoading(true);
    try {
      const data: any = await fetchApi(`/competitors/${id}/posts?top_only=${topOnly}`);
      setCompetitorPosts(data.posts || []);
    } catch (e: any) {
      showToast("err", "Gagal memuat postingan kompetitor.");
    } finally {
      setPostsLoading(false);
    }
  };

  const openCompetitorDetail = (comp: Competitor) => {
    setSelectedCompetitor(comp);
    setFilterTopOnly(false);
    loadCompetitorPosts(comp.id, false);
  };

  const handleUseAsInspiration = (post: CompetitorPost) => {
    const captionDraft = `[Inspirasi dari @${selectedCompetitor?.username || "Competitor"}]\n\n${post.caption || ""}\n\n#Inspiration #ContentStrategy`;
    openComposer([], {
      caption: captionDraft,
      media_urls: post.media_urls || (post.thumbnail_url ? [post.thumbnail_url] : []),
    });
    showToast("ok", "Ide postingan disalin ke Shiera Post Composer!");
  };

  const filteredCompetitors = competitors.filter(
    (c) =>
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.full_name && c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold shadow-xl transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === "ok"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-red-600 text-white shadow-red-500/20"
          }`}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-200" />
          )}
          {toast.text}
        </div>
      )}

      {/* Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-pink-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3 h-3 text-pink-400" /> Instagram Competitor Intelligence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-['Outfit'] tracking-tight">
              Competitor Spy &amp; Analytics
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau strategi konten, engagement rate, &amp; postingan berkinerja tinggi dari brand kompetitor Anda secara otomatis via Instagrapi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadCompetitors}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all text-xs font-semibold flex items-center gap-2"
              title="Refresh All"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-pink-400" : ""}`} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-3 px-5 rounded-2xl gradient-brand text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kompetitor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-2 p-1 bg-slate-100/80 rounded-2xl w-fit">
          {[
            { id: "accounts", label: "Daftar Kompetitor", icon: Users, count: competitors.length },
            { id: "benchmark", label: "Benchmark Matrix", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white text-purple-700 shadow-sm border border-purple-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        {activeTab === "accounts" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari username kompetitor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            />
          </div>
        )}
      </div>

      {/* ── TAB 1: ACCOUNTS LIST ── */}
      {activeTab === "accounts" && (
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Memuat data kompetitor...</p>
            </div>
          ) : filteredCompetitors.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Kompetitor Yang Dipantau</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Mulai lacak akun Instagram kompetitor brand Anda untuk melihat statistik engagement dan ide postingan terbaik.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="py-2.5 px-4 rounded-xl gradient-brand text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-purple-500/20"
              >
                <Plus className="w-4 h-4" /> Tambah Kompetitor Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCompetitors.map((comp) => {
                const isSyncing = syncingMap[comp.id];
                return (
                  <div
                    key={comp.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={comp.profile_pic_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comp.username}`}
                              alt={comp.username}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 bg-slate-50"
                              onError={(e: any) => {
                                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${comp.username}`;
                              }}
                            />
                            {comp.is_verified && (
                              <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
                                <ShieldCheck className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h3 className="font-bold text-slate-900 text-sm truncate">@{comp.username}</h3>
                              <a
                                href={`https://instagram.com/${comp.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-purple-600 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{comp.full_name || `@${comp.username}`}</p>
                            {comp.category_name && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium mt-1 inline-block">
                                {comp.category_name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleSyncCompetitor(comp.id, comp.username)}
                            disabled={isSyncing}
                            className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50"
                            title="Sync Data"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-purple-600" : ""}`} />
                          </button>
                          <button
                            onClick={() => handleDeleteCompetitor(comp.id, comp.username)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Hapus Kompetitor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bio */}
                      {comp.biography && (
                        <p className="text-xs text-slate-600 line-clamp-2 mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
                          "{comp.biography}"
                        </p>
                      )}

                      {/* Key Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                        <div className="p-2.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
                          <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">Followers</p>
                          <p className="text-sm font-extrabold text-purple-900 mt-0.5">
                            {comp.followers_count >= 1000000
                              ? `${(comp.followers_count / 1000000).toFixed(1)}M`
                              : comp.followers_count >= 1000
                              ? `${(comp.followers_count / 1000).toFixed(1)}K`
                              : comp.followers_count}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-pink-50/60 border border-pink-100 text-center">
                          <p className="text-[10px] text-pink-600 font-semibold uppercase tracking-wider">Eng. Rate</p>
                          <p className="text-sm font-extrabold text-pink-900 mt-0.5">
                            {comp.engagement_rate}%
                          </p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
                          <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Avg. Likes</p>
                          <p className="text-sm font-extrabold text-amber-900 mt-0.5">
                            {comp.avg_likes >= 1000
                              ? `${(comp.avg_likes / 1000).toFixed(1)}K`
                              : comp.avg_likes}
                          </p>
                        </div>
                      </div>

                      {/* Top Hashtags Cloud */}
                      {comp.top_hashtags && comp.top_hashtags.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Top Hashtags:</p>
                          <div className="flex flex-wrap gap-1">
                            {comp.top_hashtags.slice(0, 4).map((tag, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-700 font-medium">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openCompetitorDetail(comp)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Lihat Feed &amp; Postingan Top</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: BENCHMARK MATRIX ── */}
      {activeTab === "benchmark" && (
        <div className="space-y-5">
          {benchmarkLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !benchmarkData || benchmarkData.matrix.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-xs text-slate-500">Belum ada data kompetitor untuk di-benchmark.</p>
            </div>
          ) : (
            <>
              {/* Summary Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Total Kompetitor Dipantau</p>
                    <p className="text-2xl font-extrabold text-slate-900">{benchmarkData.total_competitors}</p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Rata-Rata Industry ER</p>
                    <p className="text-2xl font-extrabold text-pink-600">{benchmarkData.avg_industry_er}%</p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Top Performer Brand</p>
                    <p className="text-base font-extrabold text-slate-900 truncate">
                      @{benchmarkData.matrix[0]?.username || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Matrix */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">Comparison Benchmark Ranking</h3>
                  <span className="text-xs text-slate-400">Urutan berdasarkan Engagement Rate (%)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3.5 px-4">Rank</th>
                        <th className="py-3.5 px-4">Competitor</th>
                        <th className="py-3.5 px-4 text-right">Followers</th>
                        <th className="py-3.5 px-4 text-right">Avg Likes</th>
                        <th className="py-3.5 px-4 text-right">Avg Comments</th>
                        <th className="py-3.5 px-4 text-right">Engagement Rate</th>
                        <th className="py-3.5 px-4 text-center">Top Posts 🔥</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {benchmarkData.matrix.map((row: any, idx: number) => {
                        const isTop1 = idx === 0;
                        return (
                          <tr key={row.id} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-4 px-4 font-bold text-slate-700">
                              {isTop1 ? (
                                <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
                                  1
                                </span>
                              ) : idx === 1 ? (
                                <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center">
                                  2
                                </span>
                              ) : idx === 2 ? (
                                <span className="w-6 h-6 rounded-full bg-amber-700/30 text-amber-900 font-bold text-xs flex items-center justify-center">
                                  3
                                </span>
                              ) : (
                                `#${idx + 1}`
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={row.profile_pic_url || `https://api.dicebear.com/7.x/initials/svg?seed=${row.username}`}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                                  alt=""
                                />
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">@{row.username}</p>
                                  <p className="text-[10px] text-slate-400">{row.full_name || ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-semibold text-slate-700">
                              {row.followers_count.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-semibold text-slate-700">
                              {row.avg_likes.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-semibold text-slate-700">
                              {row.avg_comments.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className={`inline-flex px-2.5 py-1 rounded-full font-bold text-xs ${
                                row.engagement_rate >= benchmarkData.avg_industry_er
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}>
                                {row.engagement_rate}%
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                <Flame className="w-3 h-3 text-amber-600" /> {row.top_posts_count}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MODAL 1: ADD COMPETITOR ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Instagram className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base font-['Outfit']">Tambah Kompetitor Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCompetitor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Instagram Kompetitor
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">@</span>
                  <input
                    type="text"
                    required
                    placeholder="contoh: indomie, nike, brand_x"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Instagrapi akan mengambil profil publik, statistik engagement, &amp; 20 postingan terbaru.
                </p>
              </div>

              {addError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl gradient-brand text-white text-xs font-bold hover:opacity-90 flex items-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-60"
                >
                  {addLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{addLoading ? "Mengambil Data..." : "Mulai Pantau"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: COMPETITOR FEED & POST DETAIL ── */}
      {selectedCompetitor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCompetitor.profile_pic_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedCompetitor.username}`}
                  alt=""
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-['Outfit'] flex items-center gap-1.5">
                    @{selectedCompetitor.username}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-normal">
                      ER {selectedCompetitor.engagement_rate}%
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">{selectedCompetitor.followers_count.toLocaleString()} Followers</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newTop = !filterTopOnly;
                    setFilterTopOnly(newTop);
                    loadCompetitorPosts(selectedCompetitor.id, newTop);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    filterTopOnly
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${filterTopOnly ? "text-white" : "text-amber-500"}`} />
                  <span>Top Performers Only</span>
                </button>

                <button
                  onClick={() => setSelectedCompetitor(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="p-6 overflow-y-auto flex-1">
              {postsLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : competitorPosts.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Flame className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Belum Ada Postingan Yang Tersimpan</p>
                  <p className="text-xs text-slate-400">Klik tombol Sync di daftar kompetitor untuk menyegarkan feed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {competitorPosts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Media Thumbnail Container */}
                        <div className="relative aspect-square bg-slate-900 overflow-hidden">
                          <img
                            src={post.thumbnail_url || post.media_urls[0] || "/placeholder.jpg"}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e: any) => {
                              e.target.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop";
                            }}
                          />
                          {post.is_top_performer && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                              <Flame className="w-3 h-3 text-white fill-white" /> Top Performer
                            </span>
                          )}

                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold capitalize">
                            {post.post_type}
                          </span>
                        </div>

                        {/* Caption & Stats */}
                        <div className="p-3.5 space-y-2">
                          <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                            {post.caption || "(Tanpa caption)"}
                          </p>

                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
                            <span className="flex items-center gap-1 text-pink-600">
                              <Heart className="w-3.5 h-3.5 fill-pink-600" />
                              {post.like_count.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-blue-600">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {post.comment_count.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                              ER {post.engagement_rate}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <button
                          onClick={() => handleUseAsInspiration(post)}
                          className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Gunakan Sebagai Inspirasi</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
