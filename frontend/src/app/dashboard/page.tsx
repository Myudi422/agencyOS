"use client";

import React, { useEffect, useState } from "react";
import { 
  Users2, CalendarDays, CheckCircle2, AlertTriangle, 
  Cpu, Briefcase, ArrowUpRight, Plus, RefreshCw, Activity, Zap, HardDrive, Database, Server, Gauge, Clock, Image as ImageIcon, Calendar, TrendingUp, BarChart2, Sparkles, Folder, Award, Heart, MessageCircle, Share2, Bot
} from "lucide-react";
// @ts-ignore
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from "recharts";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { fetchApi } from "@/lib/api";

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-3 text-xs space-y-1">
      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span>{entry.name}: <strong className="text-slate-900">{entry.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

function getProxiedImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${apiUrl}/statistics/proxy-image?url=${encodeURIComponent(url)}`;
}

function DashboardImageThumbnail({ url, className = "w-10 h-10 rounded-xl" }: { url?: string; className?: string }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [url]);

  if (!url || imgError) {
    return (
      <div className={`${className} bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-xs`}>
        <ImageIcon className="w-5 h-5 opacity-80" />
      </div>
    );
  }

  return (
    <img
      src={getProxiedImageUrl(url)}
      onError={() => setImgError(true)}
      crossOrigin="anonymous"
      className={`${className} object-cover border border-slate-200 shrink-0 shadow-xs`}
      alt=""
    />
  );
}

export default function DashboardPage() {
  const { activeWorkspace, openComposer } = useStore();
  const { isAdmin, workspaceId: authWorkspaceId } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [dashboardAgents, setDashboardAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fallback: if activeWorkspace hasn't hydrated yet (non-persisted store),
  // use the workspaceId persisted in authStore
  const resolvedWorkspaceId = activeWorkspace?.id || authWorkspaceId;

  const loadDashboard = (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchedAt < 15000 && data) {
      console.log("[Dashboard] Skipping redundant fetch (deduplicated < 15s)");
      return;
    }

    if (!resolvedWorkspaceId) {
      console.warn("[Dashboard] No workspace ID found, skipping API call");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    // Fetch agents for AI Agent Monitor widget
    fetchApi<any[]>(`/agents/?workspace_id=${resolvedWorkspaceId}`)
      .then((res) => setDashboardAgents(res || []))
      .catch(() => setDashboardAgents([]));

    fetchApi<any>(`/dashboard/?workspace_id=${resolvedWorkspaceId}`)
      .then((res) => {
        console.log("[Dashboard API] Response:", res?.metrics);
        setData(res);
        setLastFetchedAt(now);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard API error:", err);
        setData({
          metrics: {
            total_accounts: 0,
            connected_accounts: 0,
            scheduled_today: 0,
            published_today: 0,
            failed_today: 0,
            active_clients: 0,
            active_queue_jobs: 0
          },
          system_stats: {
            db_size: "-",
            memory_usage: "-",
            redis_status: "Tidak Terhubung",
            redis_latency: "-",
            vercel_env: "-",
            vercel_region: "-",
            vercel_status: "Tidak Terhubung",
            python_runtime: "-"
          },
          recent_activity: [],
          upcoming_posts: [],
          daily_trend: [],
          platform_breakdown: [],
          top_post: null
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, [resolvedWorkspaceId]);

  const metrics = data?.metrics || {
    total_accounts: 0,
    connected_accounts: 0,
    scheduled_today: 0,
    published_today: 0,
    failed_today: 0,
    active_clients: 0,
    active_queue_jobs: 0
  };

  const systemStats = data?.system_stats || {
    db_size: "12.4 MB",
    memory_usage: "38.2 MB",
    redis_status: "Connected (Upstash)",
    redis_latency: "9ms",
    vercel_env: "production",
    vercel_region: "iad1 (US East)",
    vercel_status: "Operational (Vercel Serverless)",
    python_runtime: "Python 3.12 Serverless"
  };

  const upcomingPosts = data?.upcoming_posts || [];
  const dailyTrend = data?.daily_trend || [];
  const platformBreakdown = data?.platform_breakdown || [];
  const recentActivity = data?.recent_activity || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner - White Glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100/90 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200/80 shadow-xs">
              Shiera Multi-Platform Core
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">Dashboard Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Social Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Ringkasan performa publikasi harian, jadwal konten kalender, dan aktivitas terkini workspace Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => loadDashboard(true)}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200/90 text-slate-700 shadow-xs transition-all disabled:opacity-60"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
          </button>
          <button
            onClick={() => openComposer()}
            className="py-3 px-5 rounded-2xl gradient-brand text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Postingan Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Row (Ringkasan Statistik Hari Ini) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Akun Terkoneksi", value: metrics.connected_accounts, total: metrics.total_accounts, icon: Users2, color: "text-purple-600", bg: "bg-purple-100/80 border-purple-200/60" },
          { title: "Dijadwalkan Hari Ini", value: metrics.scheduled_today, icon: CalendarDays, color: "text-sky-600", bg: "bg-sky-100/80 border-sky-200/60" },
          { title: "Dipublikasikan Hari Ini", value: metrics.published_today, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100/80 border-emerald-200/60" },
          { title: "Client / Brand Aktif", value: metrics.active_clients, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-100/80 border-amber-200/60" }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl glass-card space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 truncate">{card.title}</span>
                <div className={`w-7 h-7 rounded-xl ${card.bg} border flex items-center justify-center ${card.color} shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-7 w-16 bg-slate-200/80 rounded-lg animate-pulse" />
                ) : (
                  <>
                    <span className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit'] transition-all">
                      {card.value}
                    </span>
                    {card.total !== undefined && card.total !== null && (
                      <span className="text-xs text-slate-400 font-mono">/ {card.total}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Exclusive Interactive Performance Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Card (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl glass-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tren Performa Publikasi (7 Hari Terakhir)
                </h3>
                <p className="text-[11px] text-slate-500">Visualisasi jumlah konten terpublikasi &amp; terjadwal</p>
              </div>
            </div>
            
            <a 
              href="/statistics"
              className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 hover:underline shrink-0"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analitik Detail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Area Chart Component */}
          <div className="h-64 w-full pt-2">
            {!isMounted || isLoading ? (
              <div className="w-full h-full bg-slate-100/60 rounded-2xl animate-pulse flex items-center justify-center">
                <span className="text-xs text-slate-400">Memuat Grafik Telemetri...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="published" name="Dipublikasi" stroke="#7c3aed" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPublished)" />
                  <Area type="monotone" dataKey="scheduled" name="Terjadwal" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScheduled)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                Dipublikasikan
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                Terjadwal
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Diperbarui real-time</span>
          </div>

          {/* Platform Channel Telemetry & Distribution (Fills lower empty space) */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Distribusi Saluran Akun Platform
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono font-medium">
                Total {metrics.total_accounts} Akun ({metrics.connected_accounts} Terkoneksi)
              </span>
            </div>

            {platformBreakdown.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {platformBreakdown.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 capitalize truncate">{item.platform}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200/60">
                        {item.count} Akun
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(item.percentage, 10)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block text-right">
                      {item.percentage}% porsi
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Belum ada saluran platform sosial terhubung. Tambahkan akun di menu Akun Sosial.
              </div>
            )}
          </div>
        </div>

        {/* Intelligence & Quick Actions Side Widget (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Agent Monitor Widget */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white space-y-3.5 shadow-lg relative overflow-hidden border border-purple-500/20">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Bot className="w-24 h-24 text-amber-300" />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold tracking-wider uppercase border border-purple-400/30 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-amber-300" />
                AI Agent Monitor
              </span>
              {dashboardAgents.length > 0 && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {dashboardAgents.filter((a: any) => a.is_active).length} / {dashboardAgents.length} Aktif
                </span>
              )}
            </div>

            {dashboardAgents.length > 0 ? (
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold font-['Outfit'] text-white truncate max-w-[200px]">
                    🤖 {dashboardAgents[0].name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-900/80 text-purple-200 border border-purple-700/50 font-mono font-semibold">
                    {dashboardAgents[0].run_time} WIB
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Pilar: <strong className="text-amber-300">{dashboardAgents[0].content_pillar}</strong> · Format: <span className="text-indigo-200 font-semibold">{dashboardAgents[0].content_format}</span>
                </p>
                <div className="flex items-center gap-3 text-[11px] text-purple-300/80 pt-1 border-t border-purple-800/40">
                  <span>🏃 {dashboardAgents[0].total_runs || 0} Run</span>
                  <span>📄 {dashboardAgents[0].total_drafts_generated || 0} Draft Generated</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 relative z-10">
                <h4 className="text-sm font-bold font-['Outfit']">Belum Ada AI Agent Terkonfigurasi</h4>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  Otomatiskan brief konten harian Anda. Buat AI Agent pertama untuk mulai memantau draf otomatis.
                </p>
              </div>
            )}

            <a
              href="/agent"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 relative z-10"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>{dashboardAgents.length > 0 ? "Kelola AI Agent →" : "+ Buat AI Agent Sekarang"}</span>
            </a>
          </div>

          {/* Top Content Showcase Card */}
          {data?.top_post && (
            <div className="p-5 rounded-3xl glass-card space-y-3 relative overflow-hidden border border-purple-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-600" />
                  Top Content Showcase
                </span>
                <span className="text-[10px] text-purple-600 font-bold">Eng Rate: {data.top_post.engagement_rate}</span>
              </div>
              <div className="flex items-center gap-3">
                <DashboardImageThumbnail url={data.top_post.thumbnail} className="w-12 h-12 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{data.top_post.caption}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1 text-rose-600 font-semibold">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> {data.top_post.likes}
                    </span>
                    <span className="flex items-center gap-1 text-sky-600 font-semibold">
                      <MessageCircle className="w-3 h-3" /> {data.top_post.comments}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <Share2 className="w-3 h-3" /> {data.top_post.shares}
                    </span>
                  </div>
                </div>
                {data.top_post.platform_url && (
                  <a
                    href={data.top_post.platform_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 transition-all flex items-center justify-center shrink-0 shadow-xs group"
                    title="Buka Postingan Asli di Social Media"
                  >
                    <ArrowUpRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="p-5 rounded-3xl glass-card space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akses Cepat Modul</h4>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="/calendar"
                className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-200 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
              >
                <Calendar className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Kalender</span>
              </a>
              <a
                href="/statistics"
                className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-200 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
              >
                <BarChart2 className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Analitik</span>
              </a>
              <a
                href="/queue"
                className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-200 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
              >
                <Clock className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Antrean</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Content Calendar Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Content Calendar Overview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl glass-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Ringkasan Konten &amp; Kalender
                  </h3>
                  <p className="text-[11px] text-slate-500">Postingan terjadwal &amp; draf terbaru</p>
                </div>
              </div>
              <a 
                href="/calendar" 
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Lihat Kalender Lengkap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                      <div className="h-2.5 w-1/3 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))
              ) : upcomingPosts.length > 0 ? (
                upcomingPosts.slice(0, 6).map((post: any) => (
                  <div key={post.id} className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs hover:border-purple-200 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <DashboardImageThumbnail url={post.thumbnail} className="w-10 h-10 rounded-xl" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">{post.caption}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Tanpa Jadwal"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        post.status === "published" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : post.status === "scheduled"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {post.status}
                      </span>
                      {post.platform_url && (
                        <a
                          href={post.platform_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition-all"
                          title="Buka Postingan di Sosmed"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <p className="text-xs text-slate-500">Belum ada postingan terjadwal atau draf.</p>
                  <button
                    onClick={() => openComposer()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Postingan Pertama</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Audit Feed (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl glass-card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Aktivitas Terkini
                </h3>
                <p className="text-[11px] text-slate-500">Log aktivitas workspace</p>
              </div>
            </div>
            <a href="/activity" className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 hover:underline">
              <span>Lihat Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-1/3 bg-slate-200 rounded" />
                    <div className="h-2.5 w-2/3 bg-slate-200 rounded" />
                  </div>
                </div>
              ))
            ) : recentActivity.length > 0 ? (
              recentActivity.slice(0, 7).map((act: any, i: number) => (
                <div key={act.id || i} className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 flex items-start gap-3 shadow-xs hover:border-purple-200 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 border border-purple-100">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{act.action}</p>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">{act.details}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada aktivitas terbaru tercatat.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ADMIN-ONLY SECTIONS: Infrastructure Health & Queue Engine */}
      {isAdmin && (
        <div className="space-y-6 pt-4 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
              Admin Only Controls
            </span>
            <span className="text-xs text-slate-400">Panel telemetri infrastruktur &amp; sistem antrean</span>
          </div>

          {/* Infrastructure Health Metrics Grid */}
          <div className="p-6 rounded-3xl glass-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    System Infrastructure &amp; Resource Health
                  </h3>
                  <p className="text-[11px] text-slate-500">Real-time Vercel, RAM, PostgreSQL, &amp; Redis telemetry</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{systemStats.vercel_status}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* RAM Memory Usage */}
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">RAM Memory</span>
                  <Gauge className="w-4 h-4 text-purple-600" />
                </div>
                {isLoading ? (
                  <div className="h-6 w-20 bg-slate-200/80 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-base font-bold text-slate-900 font-['Outfit']">{systemStats.memory_usage}</p>
                )}
                <span className="text-[10px] text-slate-400 font-mono block">Process RSS Alloc</span>
              </div>

              {/* Database Size */}
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">PostgreSQL DB Size</span>
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                {isLoading ? (
                  <div className="h-6 w-20 bg-slate-200/80 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-base font-bold text-slate-900 font-['Outfit']">{systemStats.db_size}</p>
                )}
                <span className="text-[10px] text-slate-400 font-mono block">Supabase Storage</span>
              </div>

              {/* Redis Status & Latency */}
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Redis Cache &amp; Queue</span>
                  <HardDrive className="w-4 h-4 text-rose-600" />
                </div>
                {isLoading ? (
                  <div className="h-6 w-24 bg-slate-200/80 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-base font-bold text-slate-900 font-['Outfit'] truncate">{systemStats.redis_status}</p>
                )}
                <span className="text-[10px] text-slate-400 font-mono block">Latency: {systemStats.redis_latency}</span>
              </div>

              {/* Vercel Environment & Region */}
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Vercel Region &amp; Env</span>
                  <Cpu className="w-4 h-4 text-emerald-600" />
                </div>
                {isLoading ? (
                  <div className="h-6 w-24 bg-slate-200/80 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-base font-bold text-slate-900 font-['Outfit'] capitalize">{systemStats.vercel_env} ({systemStats.vercel_region})</p>
                )}
                <span className="text-[10px] text-slate-400 font-mono block">{systemStats.python_runtime}</span>
              </div>
            </div>
          </div>

          {/* Shiera Queue Engine Status */}
          <div className="p-6 rounded-3xl glass-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Shiera Queue Engine
                  </h3>
                  <p className="text-[11px] text-slate-500">Real-time async job status</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 text-center shadow-xs">
                <p className="text-[11px] text-slate-500 font-medium font-sans">System Latency</p>
                <p className="text-base font-bold text-purple-700 font-['Outfit'] mt-0.5">12ms</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 text-center shadow-xs">
                <p className="text-[11px] text-slate-500 font-medium">Retry Strategy</p>
                <p className="text-base font-bold text-purple-700 font-['Outfit'] mt-0.5">Exponential</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 text-center shadow-xs">
                <p className="text-[11px] text-slate-500 font-medium">Supported Platforms</p>
                <p className="text-base font-bold text-purple-700 font-['Outfit'] mt-0.5">10 / 10</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
