"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart2, RefreshCw, Download, Users2, Heart, MessageCircle,
  Share2, Eye, Play, UserPlus, TrendingUp, ChevronDown, Calendar,
  Filter, Loader2, AlertTriangle, ArrowUpRight, BarChart, Globe,
  Star, X, Bookmark, MousePointerClick, ChevronRight, Info,
  Image as ImageIcon, Video, LayoutGrid, List, FileText, CheckSquare,
  Square, AlignLeft, Sparkles, Sliders, Check
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";
import { toast } from "@/store/useToastStore";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SocialAccountMeta {
  id: string;
  platform_account_id: string;
  platform: string;
  name: string;
  username: string;
  avatar_url?: string;
  followers_count?: number;
}

interface AccountMetrics {
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  reach: number;
  video_views: number;
  new_followers: number;
  profile_views: number;
  website_clicks: number;
  engagement_likes: number;
  total_posts: number;
  engagement_rate: number;
}

interface AccountSummary extends SocialAccountMeta {
  metrics: AccountMetrics;
  post_count: number;
}

interface FeedPost {
  platform_post_id?: string;
  social_post_id?: string;
  posted_at?: string;
  caption?: string;
  platform_url?: string;
  media?: { url?: string; type?: string }[];
  metrics?: Partial<AccountMetrics>;
  _account_name?: string;
  _account_username?: string;
  _platform?: string;
  _avatar_url?: string;
}

interface DailyData {
  date: string;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  video_views: number;
}

interface StatsFeedResponse {
  accounts: AccountSummary[];
  aggregated: AccountMetrics;
  posts: FeedPost[];
  top_posts: FeedPost[];
  daily_breakdown: DailyData[];
  date_from: string;
  date_to: string;
  period_label: string;
  total_accounts_fetched: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  x: "#000000",
  tiktok: "#010101",
  tiktok_business: "#010101",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  pinterest: "#BD081C",
  bluesky: "#0085FF",
  threads: "#101010",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸", facebook: "📘", x: "𝕏", tiktok: "🎵",
  youtube: "▶️", linkedin: "💼", pinterest: "📌",
  bluesky: "🦋", threads: "🧵", tiktok_business: "🎵",
};

const CHART_COLORS = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#0891b2"];

type PeriodKey = "today" | "7d" | "30d" | "custom";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "custom", label: "Custom" },
];

const TIMELINE_PER_PAGE = 10;

// ─── Utils ───────────────────────────────────────────────────────────────────

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

function fmtNum(n?: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("id-ID");
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDayShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function getPlatformDisplayName(platform?: string): string {
  if (!platform) return "Account";
  const map: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    x: "X (Twitter)",
    tiktok: "TikTok",
    tiktok_business: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    pinterest: "Pinterest",
    bluesky: "Bluesky",
    threads: "Threads",
  };
  return map[platform.toLowerCase()] || platform;
}

function getProxiedImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${apiUrl}/statistics/proxy-image?url=${encodeURIComponent(url)}`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function PostMediaThumbnail({
  url,
  mediaType,
  platform,
  isGrid = false,
}: {
  url?: string;
  mediaType?: string;
  platform?: string;
  isGrid?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [url]);

  const isVideo =
    mediaType === "video" ||
    platform === "tiktok" ||
    platform === "tiktok_business" ||
    platform === "youtube";

  const sizeClasses = isGrid
    ? "w-full h-full"
    : "w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0";

  if (!url || imgError) {
    return (
      <div className={`${sizeClasses} bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shadow-xs ${isGrid ? "rounded-none" : ""}`}>
        {isVideo ? (
          <Video className={`${isGrid ? "w-8 h-8" : "w-4 h-4 sm:w-5 sm:h-5"} opacity-75`} />
        ) : (
          <ImageIcon className={`${isGrid ? "w-8 h-8" : "w-4 h-4 sm:w-5 sm:h-5"} opacity-75`} />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses}`}>
      <img
        src={getProxiedImageUrl(url)}
        onError={() => setImgError(true)}
        crossOrigin="anonymous"
        className={`${sizeClasses} object-cover ${isGrid ? "rounded-none" : "rounded-xl border border-slate-100 shadow-xs"}`}
        alt=""
      />
      {isVideo && (
        <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white p-1 rounded-md backdrop-blur-xs flex items-center gap-1 text-[9px] font-bold px-1.5">
          <Play className="w-2.5 h-2.5 fill-current" />
          {isGrid && <span>Video</span>}
        </div>
      )}
    </div>
  );
}

function PostGridCard({ post, rank }: { post: FeedPost; rank?: number }) {
  const m = post.metrics || {};
  const eng = (m.likes || 0) + (m.comments || 0) + (m.shares || 0);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all overflow-hidden group min-w-0">
      {/* Header Info */}
      <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-50">
        <div className="flex items-center gap-2 min-w-0">
          {post._avatar_url ? (
            <img src={post._avatar_url} className="w-6 h-6 rounded-full object-cover border border-slate-100 shrink-0" alt="" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              {post._account_username?.charAt(0)?.toUpperCase() || "A"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
              @{post._account_username || "user"}
            </p>
            <p className="text-[9px] text-slate-400 font-mono">{fmtDate(post.posted_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {rank !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
              rank === 1 ? "bg-amber-100 text-amber-700" :
              rank === 2 ? "bg-slate-100 text-slate-600" :
              rank === 3 ? "bg-orange-100 text-orange-700" :
              "bg-slate-50 text-slate-400"
            }`}>
              #{rank}
            </span>
          )}
          {post._platform && <PlatformBadge platform={post._platform} />}
        </div>
      </div>

      {/* Square Media Container */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center">
        <PostMediaThumbnail
          url={post.media?.[0]?.url}
          mediaType={post.media?.[0]?.type}
          platform={post._platform}
          isGrid
        />
        {post.platform_url && (
          <a
            href={post.platform_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-purple-600 transition-all shadow-xs opacity-0 group-hover:opacity-100"
            title="Buka Postingan"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Caption & Metrics */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-medium break-words">
          {post.caption || "Tidak ada caption"}
        </p>

        {/* Engagement Stats Bar */}
        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-rose-600 font-semibold" title="Likes">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-50 shrink-0" />
              {fmtNum(m.likes)}
            </span>
            <span className="flex items-center gap-1 text-sky-600 font-semibold" title="Komentar">
              <MessageCircle className="w-3 h-3 text-sky-500 shrink-0" />
              {fmtNum(m.comments)}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold" title="Shares">
              <Share2 className="w-3 h-3 text-emerald-500 shrink-0" />
              {fmtNum(m.shares)}
            </span>
          </div>
          <span className="text-purple-600 font-bold text-[10px]">
            Eng: {fmtNum(eng)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, icon: Icon, color, bg, delta, suffix = ""
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  delta?: number;
  suffix?: string;
}) {
  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2.5 sm:gap-3 hover:shadow-md hover:border-purple-200 transition-all group min-w-0">
      <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-w-0">
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight min-w-0 flex-1 pr-0.5 break-words">
          {label}
        </span>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${bg} border flex items-center justify-center ${color} shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
        <span className="text-lg sm:text-2xl font-extrabold text-slate-900 font-['Outfit'] truncate">{fmtNum(value)}{suffix}</span>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-[10px] sm:text-xs font-bold ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {delta > 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0"
      style={{ background: PLATFORM_COLORS[platform] || "#64748b" }}
    >
      {PLATFORM_ICONS[platform]} {platform}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200/70 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200/70 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-200/70 rounded-3xl" />
        <div className="h-64 bg-slate-200/70 rounded-3xl" />
      </div>
    </div>
  );
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {fmtNum(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { activeWorkspace } = useStore();

  // Account filter
  const [availableAccounts, setAvailableAccounts] = useState<SocialAccountMeta[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Period filter
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Default View Mode: "list" (as requested by user)
  const [topPostsViewMode, setTopPostsViewMode] = useState<"grid" | "list">("list");
  const [timelineViewMode, setTimelineViewMode] = useState<"grid" | "list">("list");

  // Data state
  const [data, setData] = useState<StatsFeedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Pagination for Timeline Posts
  const [timelinePage, setTimelinePage] = useState(1);

  // Chart tab
  const [chartMetric, setChartMetric] = useState<"likes" | "comments" | "shares" | "reach" | "video_views">("likes");

  // PDF Executive Customizer Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("Laporan Performa Social Media");
  const [pdfNotes, setPdfNotes] = useState(
    "Performa konten sosial media periode ini menunjukkan pertumbuhan engagement yang positif, dengan pencapaian reach dan impresi yang meningkat signifikan."
  );
  const [pdfSelectedAccounts, setPdfSelectedAccounts] = useState<string[]>([]);
  const [pdfSections, setPdfSections] = useState({
    executiveSummary: true,
    dailyTrend: true,
    accountBreakdown: true,
    topPosts: true,
    timelineFeed: true,
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Reset timeline page on data refresh ──
  useEffect(() => {
    setTimelinePage(1);
  }, [data]);

  // ── Load available accounts ──
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    fetchApi<SocialAccountMeta[]>(`/statistics/accounts?workspace_id=${activeWorkspace.id}`)
      .then((accs) => {
        setAvailableAccounts(accs);
        setPdfSelectedAccounts(accs.map(a => a.id));
      })
      .catch(() => setAvailableAccounts([]));
  }, [activeWorkspace?.id]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch statistics ──
  const loadStats = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    try {
      const { from, to } = getDateRange(period, customFrom, customTo);
      const params = new URLSearchParams({ workspace_id: activeWorkspace.id, date_from: from, date_to: to });
      selectedAccountIds.forEach(id => params.append("account_ids", id));
      const result = await fetchApi<StatsFeedResponse>(`/statistics/feed?${params.toString()}`);
      setData(result);
      setHasLoaded(true);
    } catch (err) {
      toast.error("Gagal memuat statistik. Pastikan akun sudah terhubung.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id, period, customFrom, customTo, selectedAccountIds]);

  // Auto-load when workspace is ready
  useEffect(() => {
    if (activeWorkspace?.id && !hasLoaded) loadStats();
  }, [activeWorkspace?.id]);

  // Open PDF Customizer Modal
  const handleOpenPdfModal = () => {
    if (!data) return;
    setPdfSelectedAccounts(
      selectedAccountIds.length > 0 ? selectedAccountIds : availableAccounts.map(a => a.id)
    );
    setIsPdfModalOpen(true);
  };

  // ── Multi-Page Clean PDF Generator ──
  const handleGenerateExecutivePDF = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    toast.info("Menyiapkan Laporan PDF...");

    try {
      const { jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const templateContainer = document.getElementById("executive-pdf-template");
      if (!templateContainer) {
        toast.error("Gagal memuat template PDF.");
        setIsGeneratingPdf(false);
        return;
      }

      // Temporarily display template for html2canvas rendering
      templateContainer.style.display = "block";

      const pageBlocks = Array.from(templateContainer.querySelectorAll<HTMLElement>(".pdf-page-block"));
      if (pageBlocks.length === 0) {
        toast.error("Template PDF kosong.");
        templateContainer.style.display = "none";
        setIsGeneratingPdf(false);
        return;
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let idx = 0; idx < pageBlocks.length; idx++) {
        const pageEl = pageBlocks[idx];

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: 794,
          height: 1120,
        });

        // JPEG @ 0.85 reduces file size dramatically from ~15MB to ~400KB
        const imgData = canvas.toDataURL("image/jpeg", 0.85);

        if (idx > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

        // Add interactive clickable links inside PDF
        const linkElements = Array.from(pageEl.querySelectorAll<HTMLAnchorElement>("a[data-pdf-url]"));
        const pageRect = pageEl.getBoundingClientRect();

        for (const aEl of linkElements) {
          const url = aEl.getAttribute("data-pdf-url");
          if (!url) continue;
          const rect = aEl.getBoundingClientRect();
          const x = ((rect.left - pageRect.left) / pageRect.width) * pageWidth;
          const y = ((rect.top - pageRect.top) / pageRect.height) * pageHeight;
          const w = (rect.width / pageRect.width) * pageWidth;
          const h = (rect.height / pageRect.height) * pageHeight;
          pdf.link(x, y, w, h, { url });
        }
      }

      templateContainer.style.display = "none";

      const filename = `Laporan_Performa_Social_Media_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      toast.success(`PDF Laporan (${pageBlocks.length} hlm) berhasil diunduh!`);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Gagal membuat laporan PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const agg = data?.aggregated;
  const dailyData = (data?.daily_breakdown || []).map(d => ({ ...d, label: fmtDayShort(d.date) }));

  // Pie chart data per platform
  const platformData = (data?.accounts || []).reduce<Record<string, number>>((acc, a) => {
    acc[a.platform] = (acc[a.platform] || 0) + a.metrics.likes + a.metrics.comments;
    return acc;
  }, {});
  const pieData = Object.entries(platformData).map(([name, value]) => ({ name, value }));

  // Account radar data
  const radarData = [
    { metric: "Likes", value: agg?.likes ?? 0 },
    { metric: "Comments", value: agg?.comments ?? 0 },
    { metric: "Shares", value: agg?.shares ?? 0 },
    { metric: "Reach", value: agg?.reach ?? 0 },
    { metric: "Views", value: agg?.video_views ?? 0 },
    { metric: "Followers", value: agg?.new_followers ?? 0 },
  ];

  const selectedAccountNames = selectedAccountIds.length === 0
    ? "Semua Akun"
    : availableAccounts.filter(a => selectedAccountIds.includes(a.id)).map(a => `@${a.username}`).join(", ");

  const pdfFilteredAccounts = data?.accounts.filter(a => pdfSelectedAccounts.includes(a.id)) || [];

  return (
    <div className="space-y-6 pb-16 min-w-0">
      {/* ─── Hero Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-1.5 z-10 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200">
              Analytics Engine
            </span>
            {data && (
              <span className="text-xs text-slate-500 font-mono">
                {data.total_accounts_fetched} akun · {data.aggregated.total_posts} post
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text leading-tight">
            Statistik & Performa Akun
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Monitor engagement, reach, dan performa konten semua akun sosial dalam satu dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2 z-10 flex-wrap shrink-0">
          <button
            onClick={loadStats}
            disabled={loading}
            className="py-2.5 px-4 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
            <span>{loading ? "Memuat..." : "Refresh"}</span>
          </button>
          <button
            onClick={handleOpenPdfModal}
            disabled={!data || loading}
            className="py-2.5 px-4 rounded-2xl gradient-brand text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 sm:p-4 rounded-2xl glass-card">
        {/* Account filter dropdown */}
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          <button
            onClick={() => setAccountDropdownOpen(v => !v)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-purple-300 hover:text-purple-700 transition-all w-full sm:w-auto min-w-[160px]"
          >
            <Users2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="flex-1 text-left truncate max-w-[160px] sm:max-w-[140px]">{selectedAccountNames}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
          {accountDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 z-50 w-full sm:w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-100">
                <button
                  onClick={() => { setSelectedAccountIds([]); setAccountDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedAccountIds.length === 0 ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Semua Akun
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto p-2 space-y-0.5">
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
                        {acc.avatar_url ? (
                          <img src={acc.avatar_url} className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0" alt="" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {acc.name?.charAt(0) || "A"}
                          </div>
                        )}
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold truncate">{acc.name}</p>
                          <p className="text-[10px] text-slate-400">@{acc.username} · {PLATFORM_ICONS[acc.platform]} {acc.platform}</p>
                        </div>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
              {selectedAccountIds.length > 0 && (
                <div className="p-2 border-t border-slate-100">
                  <button
                    onClick={() => { loadStats(); setAccountDropdownOpen(false); }}
                    className="w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
                  >
                    Terapkan Filter ({selectedAccountIds.length} akun)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Period pills (Scrollable on mobile) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto max-w-full no-scrollbar shrink-0">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                period === opt.key ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {period === "custom" && (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        )}

        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all disabled:opacity-60 shadow-sm w-full sm:w-auto sm:ml-auto"
        >
          <Filter className="w-3.5 h-3.5" />
          Tampilkan
        </button>
      </div>

      {/* ─── Loading ─── */}
      {loading && <LoadingSkeleton />}

      {/* ─── Empty / No API ─── */}
      {!loading && !data && hasLoaded && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <BarChart2 className="w-14 h-14 opacity-20" />
          <p className="text-sm font-medium">Belum ada data statistik</p>
          <p className="text-xs">Pastikan akun sudah terhubung dan API PostForMe aktif</p>
        </div>
      )}

      {/* ─── Main Content Area ─── */}
      {!loading && data && (
        <div className="space-y-6">
          {/* Period Info Bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex-wrap">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold">{data.period_label}</span>
            <span className="text-[11px] sm:text-xs text-purple-500 sm:ml-auto font-medium">{data.total_accounts_fetched} akun teranalisis</span>
          </div>

          {/* ─── Metric Cards Row (Responsive Grid) ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <MetricCard label="Total Post"    value={agg?.total_posts ?? 0}    icon={BarChart2}        color="text-purple-600" bg="bg-purple-100 border-purple-200" />
            <MetricCard label="Total Likes"   value={agg?.likes ?? 0}          icon={Heart}            color="text-rose-600"   bg="bg-rose-100 border-rose-200" />
            <MetricCard label="Komentar"      value={agg?.comments ?? 0}       icon={MessageCircle}    color="text-sky-600"    bg="bg-sky-100 border-sky-200" />
            <MetricCard label="Shares"        value={agg?.shares ?? 0}         icon={Share2}           color="text-emerald-600" bg="bg-emerald-100 border-emerald-200" />
            <MetricCard label="Total Reach"   value={agg?.reach ?? 0}          icon={Eye}              color="text-amber-600"  bg="bg-amber-100 border-amber-200" />
            <MetricCard label="Video Views"   value={agg?.video_views ?? 0}    icon={Play}             color="text-violet-600" bg="bg-violet-100 border-violet-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <MetricCard label="Follower Baru"     value={agg?.new_followers ?? 0}   icon={UserPlus}         color="text-teal-600"   bg="bg-teal-100 border-teal-200" />
            <MetricCard label="Profile Views"     value={agg?.profile_views ?? 0}   icon={TrendingUp}       color="text-indigo-600" bg="bg-indigo-100 border-indigo-200" />
            <MetricCard label="Website Clicks"    value={agg?.website_clicks ?? 0}  icon={MousePointerClick} color="text-orange-600" bg="bg-orange-100 border-orange-200" />
            <MetricCard label="Saves/Favorites"   value={agg?.favorites ?? 0}       icon={Bookmark}         color="text-pink-600"   bg="bg-pink-100 border-pink-200" />
            <MetricCard label="Engagement Rate"   value={agg?.engagement_rate ?? 0} icon={Star}             color="text-yellow-600" bg="bg-yellow-100 border-yellow-200" suffix="%" />
            <MetricCard label="Eng. Likes"        value={agg?.engagement_likes ?? 0} icon={Heart}           color="text-red-600"    bg="bg-red-100 border-red-200" />
          </div>

          {/* ─── Charts Row ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Line/Area Chart */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl glass-card space-y-4 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tren Harian</h3>
                    <p className="text-[11px] text-slate-500">Performa konten per hari</p>
                  </div>
                </div>
                {/* Metric tab switcher (Scrollable on mobile) */}
                <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto max-w-full shrink-0 no-scrollbar">
                  {(["likes", "comments", "shares", "reach", "video_views"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setChartMetric(m)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                        chartMetric === m ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {m === "video_views" ? "Views" : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {dailyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2">
                  <BarChart2 className="w-10 h-10 opacity-40" />
                  <p className="text-xs">Tidak ada data untuk periode ini</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtNum} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={chartMetric}
                      stroke="#7c3aed"
                      strokeWidth={2.5}
                      fill="url(#areaGradient)"
                      dot={{ fill: "#7c3aed", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      name={chartMetric === "video_views" ? "Video Views" : chartMetric.charAt(0).toUpperCase() + chartMetric.slice(1)}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart — Platform Distribution */}
            <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4 min-w-0">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Platform Mix</h3>
                  <p className="text-[11px] text-slate-500">Distribusi engagement per platform</p>
                </div>
              </div>
              {pieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2">
                  <Globe className="w-10 h-10 opacity-40" />
                  <p className="text-xs">Tidak ada data</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={PLATFORM_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0];
                          return (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 text-xs">
                              <p className="font-bold text-slate-700 capitalize">{String(d.name)}</p>
                              <p className="font-semibold text-purple-700">{fmtNum(Number(d.value))}</p>
                            </div>
                          );
                        }}
                        contentStyle={{ fontSize: "11px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-1.5">
                    {pieData.slice(0, 5).map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PLATFORM_COLORS[d.name] || CHART_COLORS[i] }} />
                          <span className="text-slate-600 font-medium capitalize truncate">{d.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 shrink-0">{fmtNum(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Second Charts Row ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart — Posts per day */}
            <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4 min-w-0">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Frekuensi Post</h3>
                  <p className="text-[11px] text-slate-500">Jumlah post yang diterbitkan per hari</p>
                </div>
              </div>
              {dailyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2">
                  <BarChart className="w-10 h-10 opacity-40" />
                  <p className="text-xs">Tidak ada data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ReBarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="posts" name="Post" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Radar Chart — Metrics overview */}
            <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4 min-w-0">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Radar Performa</h3>
                  <p className="text-[11px] text-slate-500">Distribusi kekuatan metrik konten</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name="Metrik" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 text-xs">
                          <p className="font-bold text-slate-700">{String(d.name)}</p>
                          <p className="font-semibold text-purple-700">{fmtNum(Number(d.value))}</p>
                        </div>
                      );
                    }}
                    contentStyle={{ fontSize: "11px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ─── Per-Account Breakdown ─── */}
          {data.accounts.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4 min-w-0">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Users2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Performa Per Akun</h3>
                  <p className="text-[11px] text-slate-500">Breakdown metrik tiap akun sosial</p>
                </div>
              </div>

              {/* Desktop & Mobile Responsive Table */}
              <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[650px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Akun</th>
                      <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 px-3">Post</th>
                      <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 px-3">Likes</th>
                      <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 px-3">Komentar</th>
                      <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 px-3">Shares</th>
                      <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 px-3">Reach</th>
                      <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 px-3">Views</th>
                      <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3 pl-3">Eng. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.accounts
                      .sort((a, b) => b.metrics.likes - a.metrics.likes)
                      .map(acc => (
                        <tr key={acc.id} className="hover:bg-purple-50/30 transition-colors group">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {acc.avatar_url ? (
                                <img src={acc.avatar_url} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" alt="" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                                  {acc.name?.charAt(0) || "A"}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-800 truncate">{acc.name}</p>
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                  <PlatformBadge platform={acc.platform} />
                                  <span className="text-[10px] text-slate-400 truncate">@{acc.username}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-semibold text-slate-700">{acc.post_count}</td>
                          <td className="py-3.5 px-3 text-right font-semibold text-rose-600">{fmtNum(acc.metrics.likes)}</td>
                          <td className="py-3.5 px-3 text-right font-semibold text-sky-600">{fmtNum(acc.metrics.comments)}</td>
                          <td className="py-3.5 px-3 text-right font-semibold text-emerald-600">{fmtNum(acc.metrics.shares)}</td>
                          <td className="py-3.5 px-3 text-right font-semibold text-amber-600">{fmtNum(acc.metrics.reach)}</td>
                          <td className="py-3.5 px-3 text-right font-semibold text-violet-600">{fmtNum(acc.metrics.video_views)}</td>
                          <td className="py-3.5 pl-3 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              acc.metrics.engagement_rate >= 3
                                ? "bg-emerald-100 text-emerald-700"
                                : acc.metrics.engagement_rate >= 1
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {acc.metrics.engagement_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── Engagement Multi-Bar Chart ─── */}
          {data.accounts.length > 1 && (
            <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4 min-w-0">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Perbandingan Akun</h3>
                  <p className="text-[11px] text-slate-500">Likes & comments per akun dalam periode ini</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ReBarChart
                  data={data.accounts.slice(0, 8).map(a => ({
                    name: a.username || a.name,
                    Likes: a.metrics.likes,
                    Komentar: a.metrics.comments,
                    Shares: a.metrics.shares,
                  }))}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtNum} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="Likes" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Komentar" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Shares" fill="#10b981" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ─── Top Posts ─── */}
          {data.top_posts && data.top_posts.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Posts</h3>
                    <p className="text-[11px] text-slate-500">Konten dengan engagement tertinggi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* View Mode Switcher */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 rounded-xl">
                    <button
                      onClick={() => setTopPostsViewMode("list")}
                      className={`p-1.5 rounded-lg transition-all ${
                        topPostsViewMode === "list" ? "bg-white text-purple-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                      }`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTopPostsViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-all ${
                        topPostsViewMode === "grid" ? "bg-white text-purple-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                      }`}
                      title="Grid View (Instagram Style)"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Top {Math.min(data.top_posts.length, 10)}</span>
                </div>
              </div>

              {/* Grid View vs List View */}
              {topPostsViewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.top_posts.slice(0, 10).map((post, idx) => (
                    <PostGridCard key={idx} post={post} rank={idx + 1} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {data.top_posts.slice(0, 10).map((post, idx) => {
                    const m = post.metrics || {};
                    const eng = (m.likes || 0) + (m.comments || 0) + (m.shares || 0);
                    return (
                      <div key={idx} className="flex items-start gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 hover:shadow-sm transition-all group min-w-0">
                        {/* Rank */}
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 ? "bg-amber-100 text-amber-700" :
                          idx === 1 ? "bg-slate-100 text-slate-600" :
                          idx === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-slate-50 text-slate-400"
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Thumbnail with Error Fallback */}
                        <PostMediaThumbnail
                          url={post.media?.[0]?.url}
                          mediaType={post.media?.[0]?.type}
                          platform={post._platform}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {post._platform && <PlatformBadge platform={post._platform} />}
                            {post._account_username && (
                              <span className="text-[10px] text-slate-400 truncate">@{post._account_username}</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono sm:ml-auto">{fmtDate(post.posted_at)}</span>
                          </div>
                          <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-medium break-words">
                            {post.caption || "Tidak ada caption"}
                          </p>
                          <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                            <span className="flex items-center gap-1 text-rose-600 font-semibold"><Heart className="w-3 h-3 shrink-0" />{fmtNum(m.likes)}</span>
                            <span className="flex items-center gap-1 text-sky-600 font-semibold"><MessageCircle className="w-3 h-3 shrink-0" />{fmtNum(m.comments)}</span>
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold"><Share2 className="w-3 h-3 shrink-0" />{fmtNum(m.shares)}</span>
                            {(m.reach ?? 0) > 0 && <span className="flex items-center gap-1 text-amber-600 font-semibold"><Eye className="w-3 h-3 shrink-0" />{fmtNum(m.reach)}</span>}
                            <span className="ml-auto text-purple-600 font-bold">Eng: {fmtNum(eng)}</span>
                          </div>
                        </div>

                        {/* External link */}
                        {post.platform_url && (
                          <a
                            href={post.platform_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── All Posts Timeline (Paginated - 10 per page) ─── */}
          {data.posts && data.posts.length > 0 && (() => {
            const totalTimelinePages = Math.ceil(data.posts.length / TIMELINE_PER_PAGE);
            const currentPosts = data.posts.slice(
              (timelinePage - 1) * TIMELINE_PER_PAGE,
              timelinePage * TIMELINE_PER_PAGE
            );

            return (
              <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Timeline Post</h3>
                      <p className="text-[11px] text-slate-500">Postingan terbaru dalam periode</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 rounded-xl">
                      <button
                        onClick={() => setTimelineViewMode("list")}
                        className={`p-1.5 rounded-lg transition-all ${
                          timelineViewMode === "list" ? "bg-white text-purple-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                        }`}
                        title="List View"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTimelineViewMode("grid")}
                        className={`p-1.5 rounded-lg transition-all ${
                          timelineViewMode === "grid" ? "bg-white text-purple-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                        }`}
                        title="Grid View (Instagram Style)"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Total {data.posts.length} post
                    </span>
                  </div>
                </div>

                {/* Grid View vs List View */}
                {timelineViewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentPosts.map((post, idx) => (
                      <PostGridCard key={idx} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentPosts.map((post, idx) => {
                      const m = post.metrics || {};
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 transition-all text-xs min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <PostMediaThumbnail
                              url={post.media?.[0]?.url}
                              mediaType={post.media?.[0]?.type}
                              platform={post._platform}
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {post._platform && <PlatformBadge platform={post._platform} />}
                                {post._account_username && (
                                  <span className="text-[10px] text-slate-400 truncate">@{post._account_username}</span>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono sm:ml-auto">
                                  {fmtDate(post.posted_at)}
                                </span>
                              </div>
                              <p className="text-slate-700 truncate font-medium">{post.caption || "—"}</p>
                            </div>
                          </div>

                          {/* Engagement stats & link */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50 text-[11px] shrink-0">
                            <div className="flex items-center gap-2.5">
                              <span className="text-rose-500 font-bold flex items-center gap-1"><Heart className="w-3 h-3 shrink-0" />{fmtNum(m.likes)}</span>
                              <span className="text-sky-500 font-bold flex items-center gap-1"><MessageCircle className="w-3 h-3 shrink-0" />{fmtNum(m.comments)}</span>
                              <span className="text-emerald-500 font-bold flex items-center gap-1"><Share2 className="w-3 h-3 shrink-0" />{fmtNum(m.shares)}</span>
                            </div>
                            {post.platform_url && (
                              <a href={post.platform_url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-purple-600 transition-colors p-1">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalTimelinePages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs flex-wrap gap-2">
                    <span className="text-slate-500 font-medium text-[11px]">
                      Halaman {timelinePage} dari {totalTimelinePages} ({data.posts.length} post)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={timelinePage === 1}
                        onClick={() => setTimelinePage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-[11px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        ← Prev
                      </button>
                      <button
                        disabled={timelinePage >= totalTimelinePages}
                        onClick={() => setTimelinePage(p => Math.min(totalTimelinePages, p + 1))}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-[11px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Empty posts state */}
          {(!data.posts || data.posts.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-300 p-6 rounded-3xl glass-card">
              <Info className="w-10 h-10 opacity-40" />
              <p className="text-sm font-medium text-slate-500">Tidak ada post dalam periode ini</p>
              <p className="text-xs text-slate-400">Coba ubah filter periode atau pilih akun yang berbeda</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── EXECUTIVE PDF CUSTOMIZER MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Konfigurasi Laporan PDF
                  </h3>
                  <p className="text-[11px] text-slate-500">Sesuaikan judul, akun, seksi, & catatan sebelum di-download</p>
                </div>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
              {/* Judul Laporan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  Judul Laporan
                </label>
                <input
                  type="text"
                  value={pdfTitle}
                  onChange={e => setPdfTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. Laporan Performa Social Media"
                />
              </div>

              {/* Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Users2 className="w-3.5 h-3.5 text-purple-600" />
                  Pilih Akun yang Dilibatkan ({pdfSelectedAccounts.length} akun dipilih)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-36 overflow-y-auto">
                  {availableAccounts.map(acc => {
                    const isSelected = pdfSelectedAccounts.includes(acc.id);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setPdfSelectedAccounts(prev =>
                            isSelected ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                          );
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-purple-200"
                        }`}
                      >
                        <span>{PLATFORM_ICONS[acc.platform]}</span>
                        <span>@{acc.username}</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sections Checkbox Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  Pilih Seksi Laporan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  {[
                    { key: "executiveSummary", label: "Ringkasan Metrik KPI" },
                    { key: "dailyTrend", label: "Grafik Tren Harian" },
                    { key: "accountBreakdown", label: "Performa Per Akun (Tabel)" },
                    { key: "topPosts", label: "Top Posts (Konten Terbaik)" },
                    { key: "timelineFeed", label: "Timeline Feed Postingan" },
                  ].map(sec => {
                    const isChecked = (pdfSections as any)[sec.key];
                    return (
                      <button
                        key={sec.key}
                        type="button"
                        onClick={() => {
                          setPdfSections(prev => ({ ...prev, [sec.key]: !isChecked }));
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isChecked
                            ? "bg-white text-purple-900 border-purple-200 font-bold shadow-xs"
                            : "bg-white/60 text-slate-400 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span>{sec.label}</span>
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Catatan & Analisa Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-purple-600" />
                  Catatan & Analisa Manager (Optional)
                </label>
                <textarea
                  rows={3}
                  value={pdfNotes}
                  onChange={e => setPdfNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-xs leading-relaxed"
                  placeholder="Tuliskan poin analisa atau catatan penting sosial media..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleGenerateExecutivePDF}
                disabled={isGeneratingPdf || pdfSelectedAccounts.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white gradient-brand flex items-center gap-2 shadow-md shadow-purple-500/20 hover:shadow-lg disabled:opacity-60 transition-all"
              >
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download PDF Laporan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── DYNAMIC MULTI-PAGE CLEAN A4 PRINT TEMPLATES FOR PDF EXPORT ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        id="executive-pdf-template"
        className="fixed top-0 left-[-9999px] text-slate-900 select-none font-sans"
        style={{ display: "none" }}
      >
        {(() => {
          const posts = data?.posts || [];
          const topPosts = data?.top_posts || [];

          const hasPage2 = pdfSections.topPosts || pdfSections.timelineFeed;
          const remainingTimelinePosts = pdfSections.timelineFeed ? posts.slice(5) : [];

          // Divide remaining posts into chunks of 8 per page to guarantee clean spacing
          const extraPagesChunks: FeedPost[][] = [];
          for (let i = 0; i < remainingTimelinePosts.length; i += 8) {
            extraPagesChunks.push(remainingTimelinePosts.slice(i, i + 8));
          }

          const totalPages = 1 + (hasPage2 ? 1 : 0) + extraPagesChunks.length;

          return (
            <>
              {/* ── PAGE 1 ── */}
              <div className="pdf-page-block w-[794px] h-[1120px] bg-white p-10 flex flex-col justify-between box-border overflow-hidden">
                <div className="space-y-5">
                  {/* Clean Typography Header */}
                  <div className="pb-4 border-b-2 border-purple-600 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black tracking-widest text-purple-700 uppercase block">
                          SHIERA ANALYTICS ENGINE
                        </span>
                        <h1 className="text-xl font-extrabold text-slate-900 leading-snug">{pdfTitle}</h1>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          LAPORAN ANALISA
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Header Meta Row */}
                    <div className="flex items-center gap-6 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Periode: </span>
                        <span className="font-bold text-slate-800">{data?.period_label}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Cakupan: </span>
                        <span className="font-bold text-slate-800">{pdfFilteredAccounts.length} Akun Sosial Media</span>
                      </div>
                    </div>
                  </div>

                  {/* Catatan Analisa Manager */}
                  {pdfNotes.trim() && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Catatan & Analisa Manager</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line py-0.5">{pdfNotes}</p>
                    </div>
                  )}

                  {/* Section 1: KPI Summary Cards */}
                  {pdfSections.executiveSummary && (
                    <div className="space-y-2.5">
                      <h2 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                        Ringkasan Metrik KPI
                      </h2>
                      <div className="grid grid-cols-4 gap-2.5">
                        {[
                          { label: "Total Post", val: fmtNum(agg?.total_posts), color: "text-purple-600" },
                          { label: "Total Likes", val: fmtNum(agg?.likes), color: "text-rose-600" },
                          { label: "Total Comments", val: fmtNum(agg?.comments), color: "text-sky-600" },
                          { label: "Total Shares", val: fmtNum(agg?.shares), color: "text-emerald-600" },
                          { label: "Total Reach", val: fmtNum(agg?.reach), color: "text-amber-600" },
                          { label: "Video Views", val: fmtNum(agg?.video_views), color: "text-violet-600" },
                          { label: "New Followers", val: fmtNum(agg?.new_followers), color: "text-teal-600" },
                          { label: "Engagement Rate", val: `${agg?.engagement_rate ?? 0}%`, color: "text-yellow-600" },
                        ].map((kpi, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase block">{kpi.label}</span>
                            <p className={`text-base font-extrabold ${kpi.color}`}>{kpi.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Grafik Visual Tren Harian */}
                  {pdfSections.dailyTrend && dailyData.length > 0 && (
                    <div className="space-y-1.5">
                      <h2 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                        Grafik Visual Tren Harian ({chartMetric.toUpperCase()})
                      </h2>
                      <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/90 flex justify-center">
                        <AreaChart width={700} height={120} data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="pdfAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#64748b" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 8, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={fmtNum} />
                          <Area
                            type="monotone"
                            dataKey={chartMetric}
                            stroke="#7c3aed"
                            strokeWidth={2}
                            fill="url(#pdfAreaGradient)"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </div>
                    </div>
                  )}

                  {/* Section 3: Performa Per Akun Table */}
                  {pdfSections.accountBreakdown && pdfFilteredAccounts.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                        Performa Per Akun Sosial
                      </h2>
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/80">
                            <th className="text-left py-1.5 px-3 font-bold text-slate-600 text-[10px]">Akun</th>
                            <th className="text-right py-1.5 px-3 font-bold text-slate-600 text-[10px]">Post</th>
                            <th className="text-right py-1.5 px-3 font-bold text-slate-600 text-[10px]">Likes</th>
                            <th className="text-right py-1.5 px-3 font-bold text-slate-600 text-[10px]">Komentar</th>
                            <th className="text-right py-1.5 px-3 font-bold text-slate-600 text-[10px]">Shares</th>
                            <th className="text-right py-1.5 px-3 font-bold text-slate-600 text-[10px]">Reach</th>
                            <th className="text-right py-1.5 px-3 font-bold text-slate-600 text-[10px]">Eng. Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pdfFilteredAccounts.map(acc => (
                            <tr key={acc.id}>
                              <td className="py-2 px-3 font-bold text-slate-800 text-[11px] leading-relaxed">
                                <span className="text-purple-700 font-extrabold text-[10px] font-mono mr-1.5">
                                  [{getPlatformDisplayName(acc.platform)}]
                                </span>
                                @{acc.username}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-[11px]">{acc.post_count}</td>
                              <td className="py-2 px-3 text-right text-rose-600 font-semibold text-[11px]">{fmtNum(acc.metrics.likes)}</td>
                              <td className="py-2 px-3 text-right text-sky-600 font-semibold text-[11px]">{fmtNum(acc.metrics.comments)}</td>
                              <td className="py-2 px-3 text-right text-emerald-600 font-semibold text-[11px]">{fmtNum(acc.metrics.shares)}</td>
                              <td className="py-2 px-3 text-right text-amber-600 font-semibold text-[11px]">{fmtNum(acc.metrics.reach)}</td>
                              <td className="py-2 px-3 text-right font-bold text-purple-700 text-[11px]">{acc.metrics.engagement_rate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Page 1 Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>CONFIDENTIAL REPORT • Shiera Social Media Management</span>
                  <span>Halaman 1 dari {totalPages}</span>
                </div>
              </div>

              {/* ── PAGE 2 ── */}
              {hasPage2 && (
                <div className="pdf-page-block w-[794px] h-[1120px] bg-white p-10 flex flex-col justify-between box-border overflow-hidden">
                  <div className="space-y-6">
                    {/* Mini Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
                        SHIERA ANALYTICS • {pdfTitle}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{data?.period_label}</span>
                    </div>

                    {/* Section 4: Top Performing Posts */}
                    {pdfSections.topPosts && topPosts.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                          Top 5 Postingan Terbaik
                        </h2>
                        <div className="divide-y divide-slate-100">
                          {topPosts.slice(0, 5).map((post, i) => {
                            const m = post.metrics || {};
                            const eng = (m.likes || 0) + (m.comments || 0) + (m.shares || 0);
                            return (
                              <div key={i} className="py-2.5 flex items-center justify-between text-xs gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span className="font-extrabold text-purple-700 text-xs w-5 shrink-0">#{i + 1}</span>

                                  {/* Media Thumbnail */}
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                                    {post.media?.[0]?.url ? (
                                      <img
                                        src={getProxiedImageUrl(post.media[0].url)}
                                        className="w-full h-full object-cover"
                                        alt=""
                                        crossOrigin="anonymous"
                                      />
                                    ) : post._platform === "tiktok" || post._platform === "tiktok_business" || post._platform === "youtube" || post.media?.[0]?.type === "video" ? (
                                      <Video className="w-3.5 h-3.5 text-purple-600 opacity-75" />
                                    ) : (
                                      <ImageIcon className="w-3.5 h-3.5 text-purple-600 opacity-75" />
                                    )}
                                  </div>

                                  <span className="text-purple-700 font-extrabold text-[10px] font-mono shrink-0">
                                    [{getPlatformDisplayName(post._platform)}]
                                  </span>
                                  <span className="font-bold text-slate-800 text-[11px] shrink-0">@{post._account_username}</span>
                                  <p className="text-slate-600 text-xs leading-normal truncate max-w-xs">
                                    {post.caption || "—"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 shrink-0 text-[11px] font-medium">
                                  <span className="text-rose-600 font-semibold">♥ {fmtNum(m.likes)}</span>
                                  <span className="text-sky-600 font-semibold">💬 {fmtNum(m.comments)}</span>
                                  <span className="text-emerald-600 font-semibold">↗ {fmtNum(m.shares)}</span>
                                  <span className="font-bold text-purple-700 text-[11px]">Eng: {fmtNum(eng)}</span>
                                  {post.platform_url && (
                                    <a
                                      href={post.platform_url}
                                      data-pdf-url={post.platform_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-700 font-bold hover:underline text-[10px] ml-1"
                                    >
                                      Buka ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section 5: Timeline Feed (Initial 5 posts) */}
                    {pdfSections.timelineFeed && posts.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                          Riwayat Feed Postingan ({Math.min(posts.length, 5)} Post Terbaru)
                        </h2>
                        <div className="divide-y divide-slate-100">
                          {posts.slice(0, 5).map((post, i) => {
                            const m = post.metrics || {};
                            return (
                              <div key={i} className="py-2.5 flex items-center justify-between text-xs gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span className="text-[10px] text-slate-400 font-mono w-20 shrink-0">{fmtDate(post.posted_at)}</span>

                                  {/* Media Thumbnail */}
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                                    {post.media?.[0]?.url ? (
                                      <img
                                        src={getProxiedImageUrl(post.media[0].url)}
                                        className="w-full h-full object-cover"
                                        alt=""
                                        crossOrigin="anonymous"
                                      />
                                    ) : post._platform === "tiktok" || post._platform === "tiktok_business" || post._platform === "youtube" || post.media?.[0]?.type === "video" ? (
                                      <Video className="w-3.5 h-3.5 text-purple-600 opacity-75" />
                                    ) : (
                                      <ImageIcon className="w-3.5 h-3.5 text-purple-600 opacity-75" />
                                    )}
                                  </div>

                                  <span className="text-purple-700 font-extrabold text-[10px] font-mono shrink-0">
                                    [{getPlatformDisplayName(post._platform)}]
                                  </span>
                                  <span className="font-bold text-slate-800 text-[11px] shrink-0">@{post._account_username}</span>
                                  <p className="text-slate-600 text-xs leading-normal truncate">
                                    {post.caption || "—"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 shrink-0 font-medium">
                                  <span className="text-rose-600">♥ {fmtNum(m.likes)}</span>
                                  <span className="text-sky-600">💬 {fmtNum(m.comments)}</span>
                                  <span className="text-emerald-600">↗ {fmtNum(m.shares)}</span>
                                  {post.platform_url && (
                                    <a
                                      href={post.platform_url}
                                      data-pdf-url={post.platform_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-700 font-bold hover:underline text-[10px] ml-1"
                                    >
                                      Buka ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Page 2 Footer */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>CONFIDENTIAL REPORT • Shiera Social Media Management</span>
                    <span>Halaman 2 dari {totalPages}</span>
                  </div>
                </div>
              )}

              {/* ── EXTRA PAGES (PAGE 3, 4, etc. if remaining posts exist) ── */}
              {extraPagesChunks.map((chunk, pageIdx) => {
                const currentPageNum = 2 + pageIdx + 1;
                const startIdx = 5 + pageIdx * 8 + 1;
                const endIdx = 5 + pageIdx * 8 + chunk.length;

                return (
                  <div key={pageIdx} className="pdf-page-block w-[794px] h-[1120px] bg-white p-10 flex flex-col justify-between box-border overflow-hidden">
                    <div className="space-y-6">
                      {/* Mini Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <span className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
                          SHIERA ANALYTICS • {pdfTitle} (Lanjutan)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{data?.period_label}</span>
                      </div>

                      {/* Feed Chunk */}
                      <div className="space-y-2">
                        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                          Riwayat Feed Postingan (Post {startIdx} – {endIdx})
                        </h2>
                        <div className="divide-y divide-slate-100">
                          {chunk.map((post, i) => {
                            const m = post.metrics || {};
                            return (
                              <div key={i} className="py-2.5 flex items-center justify-between text-xs gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span className="text-[10px] text-slate-400 font-mono w-20 shrink-0">{fmtDate(post.posted_at)}</span>

                                  {/* Media Thumbnail */}
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                                    {post.media?.[0]?.url ? (
                                      <img
                                        src={getProxiedImageUrl(post.media[0].url)}
                                        className="w-full h-full object-cover"
                                        alt=""
                                        crossOrigin="anonymous"
                                      />
                                    ) : post._platform === "tiktok" || post._platform === "tiktok_business" || post._platform === "youtube" || post.media?.[0]?.type === "video" ? (
                                      <Video className="w-3.5 h-3.5 text-purple-600 opacity-75" />
                                    ) : (
                                      <ImageIcon className="w-3.5 h-3.5 text-purple-600 opacity-75" />
                                    )}
                                  </div>

                                  <span className="text-purple-700 font-extrabold text-[10px] font-mono shrink-0">
                                    [{getPlatformDisplayName(post._platform)}]
                                  </span>
                                  <span className="font-bold text-slate-800 text-[11px] shrink-0">@{post._account_username}</span>
                                  <p className="text-slate-600 text-xs leading-normal truncate">
                                    {post.caption || "—"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 shrink-0 font-medium">
                                  <span className="text-rose-600">♥ {fmtNum(m.likes)}</span>
                                  <span className="text-sky-600">💬 {fmtNum(m.comments)}</span>
                                  <span className="text-emerald-600">↗ {fmtNum(m.shares)}</span>
                                  {post.platform_url && (
                                    <a
                                      href={post.platform_url}
                                      data-pdf-url={post.platform_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-700 font-bold hover:underline text-[10px] ml-1"
                                    >
                                      Buka ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>CONFIDENTIAL REPORT • Shiera Social Media Management</span>
                      <span>Halaman {currentPageNum} dari {totalPages}</span>
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>
    </div>
  );
}
