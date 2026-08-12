"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target, Plus, RefreshCw, Trash2, ExternalLink, Flame, Search,
  TrendingUp, Users, Heart, MessageSquare, Award, Sparkles,
  BarChart3, CheckCircle2, AlertCircle, Eye, ShieldCheck, Instagram,
  ChevronRight, X, CalendarDays, Clock, Filter, Loader2, ArrowRight
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { useSplashStore } from "@/store/useSplashStore";
import { useCompetitorSpyStore } from "@/store/useCompetitorSpyStore";
import Portal from "@/components/common/Portal";

interface ConnectedIgAccount {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  status: string;
  followers_count: number;
  competitors_count: number;
  max_competitors: number;
}

interface CompetitorProfilePreview {
  username: string;
  instagram_pk?: string;
  full_name?: string;
  profile_pic_url?: string;
  biography?: string;
  followers_count: number;
  following_count: number;
  media_count: number;
  is_verified: boolean;
  category_name?: string;
}

interface Competitor {
  id: string;
  workspace_id: string;
  social_account_id?: string;
  platform?: string;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
  biography?: string;
  followers_count: number;
  following_count: number;
  media_count: number;
  heart_count?: number;
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

  // Extra fields in Daily Feed
  username?: string;
  full_name?: string;
  profile_pic_url?: string;
  is_verified?: boolean;
}

type ActiveTab = "accounts" | "daily" | "benchmark";

interface AddJobState {
  jobId: string;
  username: string;
  percent: number;
  message: string;
  status: "running" | "done" | "error";
}

function TikTokCreatorEmbed({ username }: { username: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!username) return;

    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${username}" data-unique-id="${username}" data-embed-from="oembed" data-embed-type="creator" style="max-width:780px; min-width:288px; width:100%;">
          <section>
            <a target="_blank" href="https://www.tiktok.com/@${username}?refer=creator_embed">@${username}</a>
          </section>
        </blockquote>
      `;
    }

    const scriptId = "tiktok-embed-script-tag";
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, [username]);

  return (
    <div className="w-full flex justify-center py-2 overflow-x-auto min-h-[550px]">
      <div ref={containerRef} className="w-full max-w-[780px] flex justify-center" />
    </div>
  );
}

export default function CompetitorSpyPage() {

  const { activeWorkspace, openComposer } = useStore();
  const { showSplash } = useSplashStore();
  const { setAddJob, setSyncAllJob } = useCompetitorSpyStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("accounts");
  const [selectedPlatform, setSelectedPlatform] = useState<"instagram" | "tiktok">("instagram");
  const [loadingIgAccounts, setLoadingIgAccounts] = useState(true);
  const [igAccounts, setIgAccounts] = useState<ConnectedIgAccount[]>([]);
  const [selectedIgAccount, setSelectedIgAccount] = useState<ConnectedIgAccount | null>(null);


  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Competitor Modal 2-Step
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"input" | "preview">("input");
  const [inputUsername, setInputUsername] = useState("");
  const [validating, setValidating] = useState(false);
  const [validatedProfile, setValidatedProfile] = useState<CompetitorProfilePreview | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // Syncing state per competitor ID
  const [syncingMap, setSyncingMap] = useState<Record<string, boolean>>({});
  const [syncingAll, setSyncingAll] = useState(false);

  // Selected competitor for Post Detail modal
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [competitorPosts, setCompetitorPosts] = useState<CompetitorPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [filterTopOnly, setFilterTopOnly] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<"cards" | "widget">("cards");


  // Benchmark matrix state
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  // Daily Update Feed state
  const [dailyPosts, setDailyPosts] = useState<CompetitorPost[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyDays, setDailyDays] = useState<number>(1);
  const [dailyStats, setDailyStats] = useState<{
    total_posts: number;
    active_brands_count: number;
    is_fallback: boolean;
    top_viral_post: CompetitorPost | null;
  }>({ total_posts: 0, active_brands_count: 0, is_fallback: false, top_viral_post: null });

  const [dailyBrandFilter, setDailyBrandFilter] = useState<string>("all");
  const [dailyTypeFilter, setDailyTypeFilter] = useState<string>("all");
  const [dailyTopOnly, setDailyTopOnly] = useState<boolean>(false);

  // Toast message
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Initial load: IG accounts
  useEffect(() => {
    if (activeWorkspace) {
      loadIgAccounts();
    }
  }, [activeWorkspace]);

  // Load data whenever active IG account or selected platform changes
  useEffect(() => {
    if (selectedPlatform === "tiktok") {
      loadCompetitors(undefined, "tiktok");
    } else if (selectedIgAccount) {
      loadCompetitors(selectedIgAccount.id, "instagram");
      if (activeTab === "benchmark") {
        loadBenchmark(selectedIgAccount.id);
      } else if (activeTab === "daily") {
        loadDailyFeed(selectedIgAccount.id, dailyDays);
      }
    }
  }, [selectedIgAccount, selectedPlatform]);

  // Load tab specific data
  useEffect(() => {
    if (selectedPlatform === "tiktok") return;
    if (!selectedIgAccount) return;
    if (activeTab === "benchmark") {
      loadBenchmark(selectedIgAccount.id);
    } else if (activeTab === "daily") {
      loadDailyFeed(selectedIgAccount.id, dailyDays);
    }
  }, [activeTab, dailyDays]);

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadIgAccounts = async () => {
    setLoadingIgAccounts(true);
    try {
      const data: any = await fetchApi("/competitors/ig-accounts");
      const list: ConnectedIgAccount[] = data.accounts || [];
      setIgAccounts(list);
      if (list.length > 0) {
        setSelectedIgAccount((prev) => {
          if (prev && list.some(a => a.id === prev.id)) {
            return list.find(a => a.id === prev.id) || list[0];
          }
          return list[0];
        });
      } else {
        setSelectedIgAccount(null);
      }
    } catch (e: any) {
      showToast("err", "Gagal memuat daftar akun Instagram terhubung.");
    } finally {
      setLoadingIgAccounts(false);
    }
  };

  const loadCompetitors = async (socialAccountId?: string, platform = selectedPlatform) => {
    setLoading(true);
    try {
      let endpoint = `/competitors/?platform=${platform}`;
      if (platform === "instagram" && socialAccountId) {
        endpoint += `&social_account_id=${socialAccountId}`;
      }
      const data: any = await fetchApi(endpoint);
      setCompetitors(data.competitors || []);
    } catch (e: any) {
      showToast("err", "Gagal memuat daftar kompetitor.");
    } finally {
      setLoading(false);
    }
  };

  const loadBenchmark = async (socialAccountId?: string) => {
    const accId = socialAccountId || selectedIgAccount?.id;
    if (!accId) return;
    setBenchmarkLoading(true);
    try {
      const data: any = await fetchApi(`/competitors/benchmark/matrix?social_account_id=${accId}`);
      setBenchmarkData(data);
    } catch (e: any) {
      showToast("err", "Gagal memuat matrix benchmark.");
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const loadDailyFeed = async (socialAccountId?: string, days = 1) => {
    const accId = socialAccountId || selectedIgAccount?.id;
    if (!accId) return;
    setDailyLoading(true);
    try {
      const data: any = await fetchApi(`/competitors/daily-feed?social_account_id=${accId}&days=${days}`);
      setDailyPosts(data.posts || []);
      setDailyStats({
        total_posts: data.total_posts || 0,
        active_brands_count: data.active_brands_count || 0,
        is_fallback: data.is_fallback || false,
        top_viral_post: data.top_viral_post || null,
      });
    } catch (e: any) {
      showToast("err", "Gagal memuat Daily Update Feed.");
    } finally {
      setDailyLoading(false);
    }
  };

  const handleSyncAllCompetitors = async () => {
    if (selectedPlatform === "instagram" && !selectedIgAccount) return;
    setSyncingAll(true);
    try {
      const accId = selectedIgAccount ? selectedIgAccount.id : "";
      const res: any = await fetchApi(`/competitors/sync-all?social_account_id=${accId}&platform=${selectedPlatform}`, { method: "POST" });
      if (res.status === "cooldown") {
        showToast("err", res.message || "Sync baru saja dilakukan. Mohon tunggu 3 menit.");
      } else {
        showToast("ok", res.message || "Sync semua brand dimulai di background!");
        loadCompetitors(selectedIgAccount?.id, selectedPlatform);
      }
    } catch (e: any) {
      showToast("err", `Sync All gagal: ${e.message}`);
    } finally {
      setSyncingAll(false);
    }
  };

  // Step 1: Validate Username
  const handleValidateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;

    setValidating(true);
    setAddError(null);
    try {
      const res: any = await fetchApi("/competitors/validate", {
        method: "POST",
        body: JSON.stringify({
          username: inputUsername.trim(),
          platform: selectedPlatform
        }),
      });
      if (res.valid && res.profile) {
        setValidatedProfile(res.profile);
        setModalStep("preview");
      } else {
        setAddError(res.message || "Akun tidak ditemukan.");
      }
    } catch (e: any) {
      setAddError(e.message || `Gagal memverifikasi akun ${selectedPlatform === "tiktok" ? "TikTok" : "Instagram"}.`);
    } finally {
      setValidating(false);
    }
  };

  // Step 2: Confirm Add Competitor (Background execution)
  const handleConfirmAddCompetitor = async () => {
    if (!validatedProfile) return;
    if (selectedPlatform === "instagram" && !selectedIgAccount) return;

    setAddError(null);
    try {
      const res: any = await fetchApi("/competitors/", {
        method: "POST",
        body: JSON.stringify({
          social_account_id: selectedPlatform === "instagram" ? selectedIgAccount?.id : null,
          username: validatedProfile.username,
          platform: selectedPlatform
        }),
      });

      setIsAddModalOpen(false);
      setInputUsername("");
      setValidatedProfile(null);
      setModalStep("input");

      setAddJob({
        jobId: res.job_id,
        username: validatedProfile.username,
        percent: 20,
        message: `Menambahkan @${validatedProfile.username}...`,
        status: "running"
      });

      loadCompetitors(selectedIgAccount?.id, selectedPlatform);
      if (selectedPlatform === "instagram") loadIgAccounts();
    } catch (e: any) {
      setAddError(e.message || "Gagal menambahkan kompetitor.");
    }
  };


  const handleSyncCompetitor = async (id: string, username: string) => {
    setSyncingMap((prev) => ({ ...prev, [id]: true }));
    try {
      const res: any = await fetchApi(`/competitors/${id}/sync`, { method: "POST" });
      if (res.status === "cooldown") {
        showToast("err", res.message || "Silakan tunggu 3 menit sebelum sync ulang.");
      } else {
        showToast("ok", res.message || `Data @${username} berhasil diperbarui!`);
        if (selectedIgAccount) {
          loadCompetitors(selectedIgAccount.id);
        }
        if (selectedCompetitor?.id === id) {
          loadCompetitorPosts(id, filterTopOnly);
        }
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
      if (selectedIgAccount) {
        loadCompetitors(selectedIgAccount.id);
        loadIgAccounts();
      }
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

  const handleUseAsInspiration = (post: CompetitorPost, brandUsername?: string) => {
    const author = brandUsername || post.username || selectedCompetitor?.username || "Competitor";
    const captionDraft = `[Inspirasi dari @${author}]\n\n${post.caption || ""}\n\n#Inspiration #ContentStrategy`;
    openComposer([], {
      caption: captionDraft,
      media_urls: post.media_urls || (post.thumbnail_url ? [post.thumbnail_url] : []),
    });
    showToast("ok", "Ide postingan disalin ke Post Composer!");
  };

  const openAddModal = () => {
    if (selectedPlatform === "instagram") {
      if (!selectedIgAccount) return;
      if (selectedIgAccount.competitors_count >= selectedIgAccount.max_competitors) {
        showToast("err", `Batas maksimal 5 kompetitor per akun IG tercapai untuk @${selectedIgAccount.username}.`);
        return;
      }
    }
    setModalStep("input");
    setInputUsername("");
    setValidatedProfile(null);
    setAddError(null);
    setIsAddModalOpen(true);
  };


  const filteredCompetitors = competitors.filter(
    (c) =>
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.full_name && c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDailyPosts = dailyPosts.filter((p) => {
    if (dailyBrandFilter !== "all" && p.username !== dailyBrandFilter) return false;
    if (dailyTypeFilter !== "all" && p.post_type !== dailyTypeFilter) return false;
    if (dailyTopOnly && !p.is_top_performer) return false;
    return true;
  });

  if (loadingIgAccounts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat data akun Instagram...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">

      {/* Toast Notification */}
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
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3 h-3 text-pink-400" /> {selectedPlatform === "tiktok" ? "TikTok Intelligence" : "Instagram Competitor Intelligence"}
              </span>

              {/* Platform Submenu Switcher */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform("instagram")}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    selectedPlatform === "instagram"
                      ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Instagram className="w-3 h-3" />
                  <span>Instagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform("tiktok")}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    selectedPlatform === "tiktok"
                      ? "bg-gradient-to-r from-cyan-600 to-slate-900 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span>TikTok</span>
                </button>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold font-bold tracking-tight">
              Competitor Spy &amp; Analytics {selectedPlatform === "tiktok" ? "(TikTok)" : "(Instagram)"}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau strategi konten, engagement rate, &amp; postingan harian dari seluruh brand kompetitor Anda secara otomatis.
            </p>
          </div>


          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncAllCompetitors}
              disabled={syncingAll || !selectedIgAccount}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              title="Sync All Brands"
            >
              <RefreshCw className={`w-4 h-4 ${syncingAll ? "animate-spin text-pink-400" : ""}`} />
              <span>{syncingAll ? "Syncing All..." : "Sync All Brands"}</span>
            </button>
            <button
              onClick={openAddModal}
              disabled={!selectedIgAccount || (selectedIgAccount.competitors_count >= selectedIgAccount.max_competitors)}
              className="py-3 px-5 rounded-2xl gradient-brand text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kompetitor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connected Account Bar (IG vs TikTok) */}
      {selectedPlatform === "instagram" ? (
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1.5">
              <Instagram className="w-4 h-4 text-pink-600" /> Pantau Untuk Akun:
            </span>
            {igAccounts.map((acc) => {
              const isSelected = selectedIgAccount?.id === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedIgAccount(acc)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? "bg-purple-50 text-purple-900 border-purple-300 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <img
                    src={acc.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${acc.username}`}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-slate-300"
                  />
                  <span>@{acc.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    acc.competitors_count >= acc.max_competitors
                      ? "bg-amber-100 text-amber-800"
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {acc.competitors_count}/{acc.max_competitors}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedIgAccount && (
            <div className="text-[11px] text-slate-400 font-semibold shrink-0">
              Maksimal <strong className="text-slate-700">5 kompetitor</strong> per akun Instagram terhubung
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4.5 h-4.5 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">TikTok Public Scraper Engine</p>
              <p className="text-[11px] text-cyan-200 opacity-80">Pantau akun TikTok publik mana saja tanpa memerlukan login atau akun terhubung — Didukung Residential Proxy</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-extrabold uppercase shrink-0">
            No Login Required
          </span>
        </div>
      )}


      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-2 p-1 bg-slate-100/80 rounded-2xl w-fit overflow-x-auto">
          {[
            { id: "accounts", label: "Daftar Kompetitor", icon: Users, count: competitors.length },
            { id: "daily", label: "Daily Update Feed", icon: CalendarDays, badge: "Hari Ini" },
            { id: "benchmark", label: "Benchmark Matrix", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
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
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                    {tab.badge}
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
              placeholder="Cari username..."
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
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Memuat data kompetitor...</p>
            </div>
          ) : filteredCompetitors.length === 0 ? (
            <div className="p-10 md:p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Kompetitor Dipantau untuk @{selectedIgAccount?.username}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Mulai lacak akun Instagram kompetitor brand Anda untuk melihat statistik engagement dan ide postingan terbaik.
              </p>
              <button
                onClick={openAddModal}
                disabled={!selectedIgAccount || selectedIgAccount.competitors_count >= selectedIgAccount.max_competitors}
                className="py-2.5 px-4 rounded-xl gradient-brand text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50"
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
                            title="Sync Data (Cooldown 3m)"
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

      {/* ── TAB 2: DAILY UPDATE FEED ── */}
      {activeTab === "daily" && (
        <div className="space-y-5">
          {/* Top Control Bar & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Postingan Dipantau</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dailyStats.total_posts} <span className="text-xs font-normal text-slate-400">Post</span>
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Brand Aktif Memposting</p>
                <p className="text-2xl font-extrabold text-purple-700">
                  {dailyStats.active_brands_count} <span className="text-xs font-normal text-slate-400">Brand</span>
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">Most Viral Today</p>
                <p className="text-sm font-extrabold text-pink-900 truncate">
                  {dailyStats.top_viral_post ? `@${dailyStats.top_viral_post.username} (${dailyStats.top_viral_post.engagement_rate}%)` : "Belum ada"}
                </p>
              </div>
            </div>
          </div>

          {/* Time & Filter Row */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5 text-purple-600" /> Periode:
              </span>
              {[
                { label: "Hari Ini (24 Jam)", value: 1 },
                { label: "3 Hari Terakhir", value: 3 },
                { label: "7 Hari Terakhir", value: 7 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDailyDays(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    dailyDays === opt.value
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={dailyBrandFilter}
                onChange={(e) => setDailyBrandFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                <option value="all">Semua Brand</option>
                {competitors.map((c) => (
                  <option key={c.id} value={c.username}>@{c.username}</option>
                ))}
              </select>

              <select
                value={dailyTypeFilter}
                onChange={(e) => setDailyTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                <option value="all">Semua Tipe</option>
                <option value="video">Reels / Video</option>
                <option value="image">Foto Single</option>
                <option value="carousel">Carousel Slide</option>
              </select>

              <button
                onClick={() => setDailyTopOnly(!dailyTopOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  dailyTopOnly
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${dailyTopOnly ? "text-white" : "text-amber-500"}`} />
                <span>Top Performers</span>
              </button>
            </div>
          </div>

          {/* Daily Posts Grid */}
          {dailyLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Memuat Daily Feed kompetitor...</p>
            </div>
          ) : filteredDailyPosts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Postingan Untuk Periode Ini</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Coba ubah periode ke 3 atau 7 hari terakhir, atau tekan tombol Sync All Brands untuk mengambil update feed terbaru.
              </p>
              <button
                onClick={handleSyncAllCompetitors}
                disabled={syncingAll}
                className="py-2.5 px-4 rounded-xl gradient-brand text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncingAll ? "animate-spin" : ""}`} />
                <span>Sync All Brands Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDailyPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Brand Header */}
                    <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2.5">
                      <img
                        src={post.profile_pic_url || `https://api.dicebear.com/7.x/initials/svg?seed=${post.username}`}
                        alt=""
                        className="w-7 h-7 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-xs truncate">@{post.username}</p>
                        <p className="text-[10px] text-slate-400">
                          {post.posted_at
                            ? new Date(post.posted_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Baru saja"}
                        </p>
                      </div>
                    </div>

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
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    {(post.instagram_url || post.code) && (
                      <a
                        href={post.instagram_url || `https://www.instagram.com/p/${post.code}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2.5 rounded-xl bg-white hover:bg-purple-50 hover:text-purple-600 text-slate-600 font-bold text-[11px] flex items-center justify-center gap-1 transition-all border border-slate-200/80 shadow-2xs shrink-0"
                        title="Lihat Postingan di Instagram"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="text-[11px]">IG</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleUseAsInspiration(post, post.username)}
                      className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs min-w-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span className="truncate">Gunakan Sebagai Inspirasi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: BENCHMARK MATRIX ── */}
      {activeTab === "benchmark" && (
        <div className="space-y-5">
          {benchmarkLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
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
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Total Kompetitor Dipantau</p>
                    <p className="text-2xl font-extrabold text-slate-900">{benchmarkData.total_competitors}</p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Rata-Rata Industry ER</p>
                    <p className="text-2xl font-extrabold text-pink-600">{benchmarkData.avg_industry_er}%</p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
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
                  <h3 className="font-bold text-slate-900 text-sm font-bold">Comparison Benchmark Ranking</h3>
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

      {/* ── MODAL 1: ADD COMPETITOR (2-Step Validation & Confirmation) ── */}
      {isAddModalOpen && (
        <Portal>
          <div className="fixed inset-0 w-screen h-screen z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  selectedPlatform === "tiktok" ? "bg-cyan-100 text-cyan-700" : "bg-purple-100 text-purple-600"
                }`}>
                  {selectedPlatform === "tiktok" ? <Sparkles className="w-4 h-4 text-cyan-600" /> : <Instagram className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-bold">
                    Tambah Kompetitor {selectedPlatform === "tiktok" ? "TikTok" : "Instagram"} Baru
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {selectedPlatform === "tiktok"
                      ? "Dipantau via TikTok Web SSR Engine (Tanpa Login)"
                      : `Dipantau dari akun @${selectedIgAccount?.username}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STAGE 1: INPUT & VALIDATE */}
            {modalStep === "input" && (
              <form onSubmit={handleValidateUsername} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username {selectedPlatform === "tiktok" ? "TikTok" : "Instagram"} Kompetitor
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">@</span>
                    <input
                      type="text"
                      required
                      placeholder={selectedPlatform === "tiktok" ? "contoh: khaby.lame, tiktok, gopro" : "contoh: indomie, nike, brand_x"}
                      value={inputUsername}
                      onChange={(e) => setInputUsername(e.target.value)}
                      className={`w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 font-semibold ${
                        selectedPlatform === "tiktok" ? "focus:ring-cyan-400" : "focus:ring-purple-400"
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Sistem akan memverifikasi keberadaan akun {selectedPlatform === "tiktok" ? "TikTok" : "Instagram"} publik kompetitor.
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
                    disabled={validating || !inputUsername.trim()}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 ${
                      selectedPlatform === "tiktok" ? "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20" : "gradient-brand shadow-purple-500/20"
                    }`}
                  >
                    {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>{validating ? "Memeriksa..." : "Cari Akun"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STAGE 2: PREVIEW PROFILE & CONFIRM */}
            {modalStep === "preview" && validatedProfile && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={validatedProfile.profile_pic_url || `https://api.dicebear.com/7.x/initials/svg?seed=${validatedProfile.username}`}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate">@{validatedProfile.username}</h4>
                        {validatedProfile.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{validatedProfile.full_name || `@${validatedProfile.username}`}</p>
                    </div>
                  </div>

                  {validatedProfile.biography && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{validatedProfile.biography}"
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Followers</p>
                      <p className="text-xs font-extrabold text-slate-800">
                        {validatedProfile.followers_count.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">
                        {selectedPlatform === "tiktok" ? "Total Hearts" : "Following"}
                      </p>
                      <p className="text-xs font-extrabold text-slate-800">
                        {selectedPlatform === "tiktok"
                          ? (validatedProfile as any).heart_count?.toLocaleString() || "-"
                          : validatedProfile.following_count.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Media/Videos</p>
                      <p className="text-xs font-extrabold text-slate-800">
                        {validatedProfile.media_count.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tekan <strong className="text-slate-800">Mulai Pantau</strong> untuk menambahkan kompetitor ini. Pengambilan profil &amp; feed postingan akan diproses secara real-time.
                </p>

                {addError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{addError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalStep("input")}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAddCompetitor}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 flex items-center gap-1.5 shadow-md ${
                      selectedPlatform === "tiktok" ? "bg-cyan-600 shadow-cyan-500/20" : "gradient-brand shadow-purple-500/20"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Mulai Pantau</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </Portal>
      )}

      {/* ── MODAL 2: COMPETITOR FEED & POST DETAIL ── */}
      {selectedCompetitor && (
        <Portal>
          <div className="fixed inset-0 w-screen h-screen z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedCompetitor.profile_pic_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedCompetitor.username}`}
                  alt=""
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm font-bold flex items-center gap-1.5 truncate">
                    @{selectedCompetitor.username}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-normal shrink-0 ${
                      selectedPlatform === "tiktok" ? "bg-cyan-100 text-cyan-800" : "bg-purple-100 text-purple-700"
                    }`}>
                      {selectedPlatform === "tiktok" ? "TikTok Creator" : `ER ${selectedCompetitor.engagement_rate}%`}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{selectedCompetitor.followers_count.toLocaleString()} Followers</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(selectedPlatform === "tiktok" || selectedCompetitor.platform === "tiktok") && (
                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-[11px] font-bold">
                    <button
                      onClick={() => setModalViewMode("cards")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        modalViewMode === "cards" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Post Cards
                    </button>
                    <button
                      onClick={() => setModalViewMode("widget")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        modalViewMode === "widget" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Widget
                    </button>
                  </div>
                )}

                {selectedPlatform === "instagram" && (
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
                )}

                <button
                  onClick={() => setSelectedCompetitor(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Posts Feed Area (Native Cards vs Widget Mode) */}

            {(selectedPlatform === "tiktok" || selectedCompetitor.platform === "tiktok") && modalViewMode === "widget" ? (
              <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-950">
                <div className="w-full max-w-[780px] bg-slate-900 p-5 rounded-3xl border border-slate-800 text-center space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-400/30 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Widget Creator TikTok @{selectedCompetitor.username}
                    </span>
                    <a
                      href={`https://www.tiktok.com/@${selectedCompetitor.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Buka Profil di App TikTok</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <TikTokCreatorEmbed username={selectedCompetitor.username} />
                </div>
              </div>

            ) : (
              <div className="p-6 overflow-y-auto flex-1">
                {postsLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
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
                            <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold capitalize ${
                              selectedPlatform === "tiktok" ? "bg-cyan-600/90" : "bg-black/60 backdrop-blur-xs"
                            }`}>
                              {selectedPlatform === "tiktok" ? "TikTok Video" : post.post_type}
                            </span>
                          </div>

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
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                selectedPlatform === "tiktok" ? "bg-cyan-100 text-cyan-800" : "bg-purple-100 text-purple-700"
                              }`}>
                                ER {post.engagement_rate}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                          <a
                            href={post.instagram_url || `https://www.tiktok.com/@${selectedCompetitor.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-2.5 rounded-xl bg-white hover:bg-cyan-50 hover:text-cyan-600 text-slate-600 font-bold text-[11px] flex items-center justify-center gap-1 transition-all border border-slate-200/80 shadow-2xs shrink-0"
                            title="Lihat Postingan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="text-[11px]">{selectedPlatform === "tiktok" ? "TikTok" : "IG"}</span>
                          </a>
                          <button
                            onClick={() => handleUseAsInspiration(post, selectedCompetitor?.username)}
                            className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs min-w-0"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span className="truncate">Gunakan Sebagai Inspirasi</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}

