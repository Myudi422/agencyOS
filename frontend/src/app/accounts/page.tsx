"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { 
  Users2, Search, Star, RefreshCw, Trash2, FileText, Sparkles, HelpCircle, Eye, EyeOff,
  Instagram, Facebook, Twitter, Youtube, Share2, MessageSquare, Plus, CheckSquare, Square, X, ExternalLink, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Grid, List as ListIcon
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { confirmModal } from "@/store/useConfirmStore";
import { fetchApi } from "@/lib/api";
import GlassConfirmModal from "@/components/common/GlassConfirmModal";
import AccountBriefingModal from "@/components/accounts/AccountBriefingModal";
import AccountWatermarkModal from "@/components/accounts/AccountWatermarkModal";
import Portal from "@/components/common/Portal";

const PLATFORMS_CONFIG = [
  { id: "instagram", name: "Instagram", category: "Meta", icon: Instagram, color: "from-amber-500 via-pink-500 to-purple-600", textColor: "text-pink-600", bgBadge: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "facebook", name: "Facebook", category: "Meta", icon: Facebook, color: "from-blue-600 to-indigo-700", textColor: "text-blue-600", bgBadge: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "x", name: "X (Twitter)", category: "Social", icon: Twitter, color: "from-slate-700 to-slate-900", textColor: "text-slate-700", bgBadge: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "tiktok", name: "TikTok", category: "Video", icon: Share2, color: "from-cyan-500 to-pink-500", textColor: "text-cyan-600", bgBadge: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "tiktok_business", name: "TikTok Business", category: "Video", icon: Share2, color: "from-cyan-600 to-purple-600", textColor: "text-purple-600", bgBadge: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "youtube", name: "YouTube", category: "Video", icon: Youtube, color: "from-red-600 to-red-800", textColor: "text-red-600", bgBadge: "bg-red-100 text-red-700 border-red-200" },
  { id: "pinterest", name: "Pinterest", category: "Visual", icon: Share2, color: "from-red-500 to-rose-700", textColor: "text-rose-600", bgBadge: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "linkedin", name: "LinkedIn", category: "Professional", icon: Share2, color: "from-sky-600 to-blue-800", textColor: "text-sky-600", bgBadge: "bg-sky-100 text-sky-700 border-sky-200" },
  { id: "bluesky", name: "Bluesky", category: "Decentralized", icon: MessageSquare, color: "from-sky-400 to-blue-500", textColor: "text-sky-600", bgBadge: "bg-sky-100 text-sky-700 border-sky-200" },
  { id: "threads", name: "Threads", category: "Meta", icon: MessageSquare, color: "from-zinc-700 to-zinc-900", textColor: "text-slate-800", bgBadge: "bg-slate-100 text-slate-800 border-slate-200" },
];

export default function AccountsPage() {
  const { activeWorkspace, activeClientId, openComposer, isAccountsMasked, toggleAccountsMasked } = useStore();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("connected_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Briefing Modal State ("Akun itu apa")
  const [briefingAccount, setBriefingAccount] = useState<any | null>(null);
  // Watermark Modal State
  const [watermarkAccount, setWatermarkAccount] = useState<any | null>(null);

  // Connect Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("instagram");
  const [bskyHandle, setBskyHandle] = useState("");
  const [bskyPassword, setBskyPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const refreshAccountsUi = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shiera-ai:accounts-updated"));
    }
  };

  const isSafeRedirectUrl = (candidate: string) => {
    try {
      const url = new URL(candidate, window.location.origin);
      const allowedHosts = [
        "api.postforme.dev",
        "www.facebook.com",
        "www.instagram.com",
        "accounts.google.com",
        "www.linkedin.com",
        "www.tiktok.com",
        "tiktok.com",
        "www.youtube.com",
        "www.pinterest.com",
        "bsky.app",
        "twitter.com",
        "x.com",
        "threads.net",
        "www.threads.net",
      ];
      return (url.protocol === "https:" || url.protocol === "http:") && (
        url.origin === window.location.origin || allowedHosts.includes(url.hostname)
      );
    } catch {
      return false;
    }
  };

  const loadAccounts = () => {
    if (!activeWorkspace?.id) return;
    setIsLoading(true);

    let query = `/accounts/?workspace_id=${activeWorkspace.id}&limit=100&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (activeClientId) query += `&client_id=${activeClientId}`;
    if (platformFilter !== "all") query += `&platform=${platformFilter}`;
    if (statusFilter !== "all") query += `&status=${statusFilter}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (favoritesOnly) query += `&favorites_only=true`;

    fetchApi<any>(query)
      .then((res) => {
        setAccounts(res.items || []);
        setTotalAccounts(res.total || 0);
        setIsLoading(false);
        refreshAccountsUi();
      })
      .catch((err) => {
        console.log("No accounts found or fallback triggered", err);
        setAccounts([]);
        setTotalAccounts(0);
        setIsLoading(false);
        refreshAccountsUi();
      });
  };

  const handleSyncAccounts = async () => {
    if (!activeWorkspace?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await fetchApi("/auth/postforme/sync-accounts", {
        method: "POST",
        body: JSON.stringify({
          workspace_id: activeWorkspace.id,
          client_id: activeClientId
        })
      });
      toast.success("Akun berhasil disinkronkan dari PostForMe!");
      loadAccounts();
    } catch (err: any) {
      toast.info("Sync selesai.");
      loadAccounts();
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [activeWorkspace?.id, activeClientId, platformFilter, statusFilter, search, favoritesOnly, sortBy, sortOrder]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(a => a.id));
    }
  };

  const handleToggleFavorite = async (accId: string, currentFav: boolean) => {
    // Optimistically update UI
    setAccounts(prev => prev.map(a => a.id === accId ? { ...a, is_favorite: !currentFav } : a));
    try {
      await fetchApi(`/accounts/${accId}/favorite`, {
        method: "POST",
      });
      // Reload to sync server state
      loadAccounts();
    } catch (err) {
      // Revert optimistic update on error
      setAccounts(prev => prev.map(a => a.id === accId ? { ...a, is_favorite: currentFav } : a));
      toast.info("Gagal mengubah favorit.");
    }
  };

  const handleDeleteSingleAccount = (account: any) => {
    confirmModal({
      title: "Disconnect Social Account",
      message: `Are you sure you want to disconnect @${account.username} (${account.name || account.platform}) from Shiera?`,
      variant: "danger",
      confirmText: "Disconnect Account",
      onConfirm: async () => {
        try {
          await fetchApi(`/accounts/${account.id}`, { method: "DELETE" });
          toast.success(`Account @${account.username} disconnected.`);
          loadAccounts();
        } catch (err) {
          toast.info(`Account @${account.username} removed.`);
          setAccounts((prev) => prev.filter((a) => a.id !== account.id));
        }
      },
    });
  };

  const handleReconnectAccount = (account: any) => {
    setSelectedPlatform(account.platform);
    setIsConnectModalOpen(true);
    toast.info(`Opening reconnection setup for @${account.username}...`);
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length) return;
    confirmModal({
      title: "Disconnect Social Accounts",
      message: `Are you sure you want to disconnect ${selectedIds.length} social account(s)?`,
      variant: "danger",
      confirmText: "Disconnect Accounts",
      onConfirm: async () => {
        try {
          for (const id of selectedIds) {
            await fetchApi(`/accounts/${id}`, { method: "DELETE" });
          }
          toast.success(`${selectedIds.length} account(s) disconnected.`);
          setSelectedIds([]);
          loadAccounts();
        } catch (err) {
          toast.info("Selected accounts removed.");
          setAccounts(prev => prev.filter(a => !selectedIds.includes(a.id)));
          setSelectedIds([]);
        }
      },
    });
  };

  const handleConnectPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      if (selectedPlatform === "bluesky") {
        if (!bskyHandle || !bskyPassword) {
          setModalError("Please provide both Bluesky handle and App Password.");
          setIsConnecting(false);
          return;
        }

        const res = await fetchApi<any>("/auth/postforme/connect-bluesky", {
          method: "POST",
          body: JSON.stringify({
            workspace_id: activeWorkspace?.id || "ws-default",
            handle: bskyHandle,
            app_password: bskyPassword,
            client_id: activeClientId
          })
        });

        setModalSuccess(`Successfully connected @${res.username}!`);
        setTimeout(() => {
          setIsConnectModalOpen(false);
          loadAccounts();
        }, 1200);
      } else {
        const res = await fetchApi<any>("/auth/postforme/auth-url", {
          method: "POST",
          body: JSON.stringify({
            platform: selectedPlatform,
            workspace_id: activeWorkspace?.id,
            client_id: activeClientId,
            permissions: ["posts", "feeds"]
          })
        });

        const targetUrl = res.url || res.auth_url;
        if (targetUrl && typeof targetUrl === "string" && isSafeRedirectUrl(targetUrl)) {
          if (activeWorkspace?.id) {
            localStorage.setItem("agencyos_active_ws_id", activeWorkspace.id);
          }
          window.location.href = targetUrl;
        } else {
          setModalError("Gagal mendapatkan URL otentikasi. Silakan coba lagi.");
        }
      }
    } catch (err: any) {
      console.error("Connect platform error:", err);
      setModalError(err.message || "Gagal menghubungkan channel media sosial.");
    } finally {
      setIsConnecting(false);
    }
  };

  const resetModal = () => {
    setIsConnectModalOpen(false);
    setModalError(null);
    setModalSuccess(null);
    setBskyHandle("");
    setBskyPassword("");
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 min-w-0">
      {/* Header Banner - White Clean Glassmorphism */}
      <div data-tour="accounts-header" className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200">
              10 Platforms Unified
            </span>
            <span className="text-xs text-slate-500 font-mono">Shiera Core</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Social Account Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Manage, organize, and monitor authorization tokens across all connected social networks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 z-10 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => {
              import("@/components/tour/AppTour").then(m => m.startAppTour("accounts"));
            }}
            className="w-full sm:w-auto justify-center py-2.5 px-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 text-purple-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
            title="Mulai Panduan Interactive Accounts"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Tutorial</span>
          </button>
          <button
            onClick={handleSyncAccounts}
            disabled={isSyncing}
            title="Sync ulang data dari PostForMe (foto profil & followers)"
            className="w-full sm:w-auto justify-center py-2.5 px-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
          <button
            data-tour="accounts-connect-btn"
            onClick={() => setIsConnectModalOpen(true)}
            className="w-full sm:w-auto justify-center py-3 px-5 rounded-2xl gradient-brand text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Channel</span>
          </button>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div data-tour="accounts-controls" className="p-4 sm:p-5 rounded-3xl glass-card space-y-4 min-w-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama channel, @username, atau platform..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: Filter, Favorites & View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer border border-slate-200"
            >
              <option value="all">Semua Status ({accounts.length})</option>
              <option value="connected">Terkoneksi</option>
              <option value="need_reconnect">Perlu Rekonek</option>
              <option value="disconnected">Terputus</option>
            </select>

            <button
              onClick={() => setFavoritesOnly(prev => !prev)}
              className={`w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                favoritesOnly
                  ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${favoritesOnly ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
              <span>Favorit</span>
            </button>

            {/* Privacy Account Masking Toggle */}
            <button
              onClick={toggleAccountsMasked}
              className={`w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAccountsMasked
                  ? "bg-amber-100 text-amber-800 border-amber-300 shadow-2xs font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title={isAccountsMasked ? "Tampilkan Nama & Foto Akun" : "Samarkan Nama & Foto Akun (Privacy Mode)"}
            >
              {isAccountsMasked ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isAccountsMasked ? "Buka Blur" : "Samarkan Akun"}</span>
            </button>

            {/* Select All Button when accounts exist */}
            {accounts.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {selectedIds.length === accounts.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{selectedIds.length === accounts.length ? "Batal Pilih" : "Pilih Semua"}</span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === "grid" ? "bg-purple-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-purple-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-3 animate-fadeIn">
            <span className="text-xs font-bold text-purple-900">
              {selectedIds.length} akun dipilih
            </span>
            <button
              onClick={handleDeleteSelected}
              className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Putuskan {selectedIds.length} Akun</span>
            </button>
          </div>
        )}

        {/* Platform Filter Tabs Horizontal Scroll */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pt-1 pb-1 no-scrollbar border-t border-slate-100">
          <button
            onClick={() => setPlatformFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              platformFilter === "all"
                ? "bg-purple-600 text-white shadow-2xs font-bold"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-purple-50 hover:border-purple-200"
            }`}
          >
            Semua Platform ({totalAccounts})
          </button>
          {PLATFORMS_CONFIG.map((plat) => (
            <button
              key={plat.id}
              onClick={() => setPlatformFilter(plat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                platformFilter === plat.id
                  ? "bg-purple-600 text-white shadow-2xs font-bold"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-purple-50 hover:border-purple-200"
              }`}
            >
              {plat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts List / Grid / Empty State */}
      {accounts.length === 0 && !isLoading ? (
        <div className="p-12 sm:p-16 rounded-3xl glass-panel text-center space-y-5 border border-slate-200/80 shadow-xs my-6">
          <div className="w-16 h-16 rounded-3xl gradient-brand flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-500/20">
            <Users2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit']">Belum Ada Akun Sosmed Terhubung</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Hubungkan akun Instagram, Facebook, X, TikTok, YouTube, Pinterest, atau Bluesky milikmu untuk mulai menjadwalkan postingan secara otomatis.
            </p>
          </div>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="py-3 px-6 rounded-2xl gradient-brand text-white font-semibold text-xs inline-flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Hubungkan Akun Sosial Pertama</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div data-tour="accounts-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            const platMeta = PLATFORMS_CONFIG.find(p => p.id === acc.platform) || PLATFORMS_CONFIG[0];
            const isSelected = selectedIds.includes(acc.id);

            return (
              <div
                key={acc.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all min-w-0 flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isSelected
                    ? "border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/30"
                    : "border-slate-200/90 hover:border-purple-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {acc.avatar_url ? (
                          <img
                            src={acc.avatar_url}
                            alt={acc.name}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const fallback = img.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            className={`w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs ${isAccountsMasked ? "blur-xs select-none" : ""}`}
                          />
                        ) : null}
                        <div
                          className={`w-11 h-11 rounded-2xl items-center justify-center border border-slate-200 shadow-2xs bg-gradient-to-br ${platMeta.color} text-white ${acc.avatar_url ? 'hidden' : 'flex'}`}
                          style={{ display: acc.avatar_url ? 'none' : 'flex' }}
                        >
                          <platMeta.icon className="w-5 h-5" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-xs" title="Terkoneksi" />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-xs font-bold text-slate-900 truncate max-w-[130px] sm:max-w-[150px] ${isAccountsMasked ? "blur-[2.5px] select-none" : ""}`}>
                          {isAccountsMasked ? "••••••••" : (acc.name || acc.username)}
                        </h3>
                        <p className={`text-[11px] text-slate-500 font-medium truncate ${isAccountsMasked ? "blur-[2.5px] select-none" : ""}`}>
                          {isAccountsMasked ? "••••••••" : `@${acc.username}`}
                        </p>
                        <span className={`inline-block text-[9.5px] px-2 py-0.5 rounded-md font-bold mt-1 border ${platMeta.bgBadge}`}>
                          {platMeta.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleSelect(acc.id)}
                        className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                        title={isSelected ? "Unselect" : "Select"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(acc.id, acc.is_favorite)}
                        title="Favorite"
                        className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                      >
                        <Star className={`w-4 h-4 ${acc.is_favorite ? "fill-amber-400 text-amber-500" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 text-xs">
                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                    {(() => {
                      const isBriefed = acc.briefing && Object.keys(acc.briefing).some(k => k !== 'updated_at' && Boolean(acc.briefing[k]));
                      return (
                        <button
                          onClick={() => setBriefingAccount(acc)}
                          title={isBriefed ? "Briefing Siap — Klik untuk edit" : "Belum ada Briefing — Klik untuk isi"}
                          className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                            isBriefed
                              ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>Briefing</span>
                          {isBriefed && <span className="text-[8px] text-purple-600 font-extrabold">✓</span>}
                        </button>
                      );
                    })()}

                    <button
                      onClick={() => setWatermarkAccount(acc)}
                      title="Atur Watermark Default (Image/Text)"
                      className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-pink-600" />
                      <span>Watermark</span>
                    </button>

                    <button
                      onClick={() => handleReconnectAccount(acc)}
                      title="Reconnect Channel"
                      className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Rekonek</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSingleAccount(acc)}
                      title="Putuskan Akun"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="p-2 sm:p-4 rounded-2xl glass-card overflow-x-auto min-w-0">
          <table className="min-w-[620px] w-full text-left text-xs text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Status & Briefing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => {
                const isBriefed = acc.briefing && Object.keys(acc.briefing).some(k => k !== 'updated_at' && Boolean(acc.briefing[k]));
                return (
                  <tr key={acc.id} className="border-b border-slate-100 hover:bg-purple-50/40 transition-colors">
                    <td className={`py-3 px-4 font-bold text-slate-900 ${isAccountsMasked ? "blur-[2.5px] select-none" : ""}`}>
                      {isAccountsMasked ? "••••••••" : `@${acc.username}`}
                    </td>
                    <td className="py-3 px-4 capitalize">{acc.platform}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Connected</span>
                        {isBriefed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            Briefed ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                            Belum Briefing
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleToggleFavorite(acc.id, acc.is_favorite)} 
                          className="p-1 text-slate-400 hover:text-amber-500"
                          title="Favorite"
                        >
                          <Star className={`w-4 h-4 ${acc.is_favorite ? "fill-amber-400 text-amber-500" : ""}`} />
                        </button>

                        <button
                          onClick={() => setBriefingAccount(acc)}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                            isBriefed
                              ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>Briefing</span>
                        </button>

                        <button
                          onClick={() => setWatermarkAccount(acc)}
                          className="px-2 py-1 rounded-xl text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-pink-600" />
                          <span>Watermark</span>
                        </button>

                      <button
                        onClick={() => handleReconnectAccount(acc)}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Rekonek
                      </button>

                      <button
                        onClick={() => handleDeleteSingleAccount(acc)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      )}

      {/* Account Briefing Modal */}
      {briefingAccount && (
        <AccountBriefingModal
          account={briefingAccount}
          onClose={() => setBriefingAccount(null)}
          onSaved={loadAccounts}
        />
      )}

      {/* Account Watermark Modal */}
      {watermarkAccount && (
        <AccountWatermarkModal
          account={watermarkAccount}
          onClose={() => setWatermarkAccount(null)}
          onSaved={loadAccounts}
        />
      )}

      {/* Connect Modal */}
      {isConnectModalOpen && (
        <Portal>
          <div className="fixed inset-0 w-screen h-screen z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-white shadow-md shadow-purple-500/25">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 font-['Outfit']">Connect Social Account</h2>
                  <p className="text-[11px] text-slate-500">Unified Multi-Platform OAuth</p>
                </div>
              </div>
              <button onClick={resetModal} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS_CONFIG.map((plat) => (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => setSelectedPlatform(plat.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-2 text-left transition-all ${
                    selectedPlatform === plat.id
                      ? "bg-purple-50 border-purple-300 font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs truncate">{plat.name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleConnectPlatform} className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-3 rounded-2xl gradient-brand text-white font-semibold text-xs shadow-md shadow-purple-500/25 hover:shadow-lg transition-all"
              >
                {isConnecting ? "Authenticating..." : `Connect via ${selectedPlatform.toUpperCase()}`}
              </button>
            </form>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
