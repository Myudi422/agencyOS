"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ExternalLink, Send, Hash, Loader2, CheckCircle2, Copy, Check,
  Eye, Heart, MessageCircle, Share2, Users, Clock, BarChart2
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const TYPE_LABELS: Record<string, string> = {
  ig_reels: "IG Reels",
  ig_feed: "IG Feed Post",
  ig_story: "IG Story",
  tiktok_video: "TikTok Video",
  youtube_short: "YouTube Short",
  youtube_video: "YouTube Video",
  twitter: "Tweet / X",
  facebook: "Facebook Post",
  linkedin: "LinkedIn Post",
};

export default function PublicKolPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Per-deliverable form state
  const [forms, setForms] = useState<Record<string, {
    content_url: string;
    stat_views: number | "";
    stat_likes: number | "";
    stat_comments: number | "";
    stat_shares: number | "";
    stat_reach: number | "";
    stat_period_days: number;
    submitting: boolean;
    success: string;
  }>>({});

  const fetchPortal = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/kol/public-portal/${token}`);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Link portal tidak valid.");
      }
      const data = await res.json();
      setPortalData(data);

      // Initialize form per deliverable
      const initForms: typeof forms = {};
      for (const d of data.deliverables || []) {
        initForms[d.id] = {
          content_url: d.content_url || "",
          stat_views: d.stats?.views ?? "",
          stat_likes: d.stats?.likes ?? "",
          stat_comments: d.stats?.comments ?? "",
          stat_shares: d.stats?.shares ?? "",
          stat_reach: d.stats?.reach ?? "",
          stat_period_days: d.stats?.period_days ?? 7,
          submitting: false,
          success: "",
        };
      }
      setForms(initForms);
    } catch (err: any) {
      setError(err.message || "Gagal memuat portal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPortal();
  }, [token]);

  const setField = (id: string, field: string, value: any) => {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent, deliverableId: string) => {
    e.preventDefault();
    const f = forms[deliverableId];
    if (!f?.content_url.trim()) return;

    setField(deliverableId, "submitting", true);
    setField(deliverableId, "success", "");

    try {
      const res = await fetch(`${API_BASE_URL}/kol/public-portal/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverable_id: deliverableId,
          content_url: f.content_url.trim(),
          stat_views: f.stat_views !== "" ? Number(f.stat_views) : null,
          stat_likes: f.stat_likes !== "" ? Number(f.stat_likes) : null,
          stat_comments: f.stat_comments !== "" ? Number(f.stat_comments) : null,
          stat_shares: f.stat_shares !== "" ? Number(f.stat_shares) : null,
          stat_reach: f.stat_reach !== "" ? Number(f.stat_reach) : null,
          stat_period_days: Number(f.stat_period_days) || 7,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Gagal menyimpan laporan.");
      }
      setField(deliverableId, "success", "Laporan berhasil disimpan!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setField(deliverableId, "submitting", false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  // ── Loading / Error States ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Memuat Portal Influencer...</p>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center max-w-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto text-2xl">⚠️</div>
          <h2 className="text-base font-extrabold text-slate-900">Portal Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const { kol, campaign, deliverables, payment_info } = portalData;

  // ── Main Portal ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 font-sans antialiased">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header Card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-purple-400/30">
                🤝
              </span>
              <div>
                <p className="text-[10px] font-extrabold text-purple-700 tracking-widest uppercase">Portal Influencer Partner</p>
                <p className="text-xs font-bold text-slate-700">{campaign.agency_name}</p>
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Tersalin!" : "Salin Link"}
            </button>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{campaign.name}</h1>
            <p className="text-xs text-slate-500">
              Halo <strong className="text-purple-700">@{kol.username}</strong> ({kol.name})!
              Isi form di bawah untuk setiap konten yang sudah kamu buat.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {campaign.brand_account && (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                {campaign.brand_account}
              </span>
            )}
            {campaign.hashtag_mandatory && (
              <span className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-bold flex items-center gap-1">
                <Hash className="w-3 h-3 text-purple-500" />
                {campaign.hashtag_mandatory}
              </span>
            )}
            {campaign.campaign_brief_url && (
              <a
                href={campaign.campaign_brief_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Buka Brief
              </a>
            )}
          </div>
        </div>

        {/* ── Deliverable Cards ─────────────────────────────────────────── */}
        {deliverables.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-400">
            Belum ada deliverable yang ditugaskan oleh agency.
          </div>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d: any) => {
              const f = forms[d.id];
              if (!f) return null;
              const hasExistingReport = !!d.content_url;
              const typeLabel = TYPE_LABELS[d.deliverable_type] || d.deliverable_type;

              return (
                <div key={d.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase bg-purple-100 text-purple-800 tracking-wide">
                        {typeLabel}
                      </span>
                      {hasExistingReport && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sudah Dilaporkan
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-800">{d.title}</h3>
                    {d.due_date && (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Deadline: {d.due_date}
                      </p>
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={(e) => handleSubmit(e, d.id)} className="p-5 space-y-5">

                    {/* Content URL */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        🔗 Link Postingan <span className="text-red-500">*</span>
                        <span className="font-normal text-slate-400 ml-1">(IG Reels / TikTok / YouTube / dll)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={f.content_url}
                          onChange={(e) => setField(d.id, "content_url", e.target.value)}
                          placeholder="https://www.instagram.com/reel/..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50/50"
                          required
                        />
                        {f.content_url && (
                          <a
                            href={f.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart2 className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-xs font-extrabold text-slate-700">Statistik Postingan</span>
                        <span className="text-[10px] text-slate-400 font-medium">(isi dari insight aplikasi)</span>
                      </div>

                      {/* Period selector */}
                      <div className="mb-3">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Diambil setelah berapa hari tayang?
                        </label>
                        <select
                          value={f.stat_period_days}
                          onChange={(e) => setField(d.id, "stat_period_days", Number(e.target.value))}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white w-full sm:w-auto"
                        >
                          <option value={3}>3 hari</option>
                          <option value={7}>7 hari (1 minggu)</option>
                          <option value={14}>14 hari (2 minggu)</option>
                          <option value={30}>30 hari (1 bulan)</option>
                        </select>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          { key: "stat_views", icon: <Eye className="w-3.5 h-3.5 text-slate-400" />, label: "Views / Tayangan" },
                          { key: "stat_reach", icon: <Users className="w-3.5 h-3.5 text-slate-400" />, label: "Reach / Jangkauan" },
                          { key: "stat_likes", icon: <Heart className="w-3.5 h-3.5 text-rose-400" />, label: "Likes / Suka" },
                          { key: "stat_comments", icon: <MessageCircle className="w-3.5 h-3.5 text-blue-400" />, label: "Komentar" },
                          { key: "stat_shares", icon: <Share2 className="w-3.5 h-3.5 text-purple-400" />, label: "Shares / Bagikan" },
                        ].map((s) => (
                          <div key={s.key}>
                            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-1">
                              {s.icon}{s.label}
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={f[s.key as keyof typeof f] as number | ""}
                              onChange={(e) =>
                                setField(d.id, s.key, e.target.value === "" ? "" : Number(e.target.value))
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50/50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    {f.success ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {f.success}
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={f.submitting || !f.content_url.trim()}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                      >
                        {f.submitting
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                          : <><Send className="w-4 h-4" /> {hasExistingReport ? "Perbarui Laporan" : "Kirim Laporan"}</>
                        }
                      </button>
                    )}
                  </form>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Payment Footer ───────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Fee Disepakati</span>
            <span className="text-base font-extrabold text-slate-900">{formatRupiah(payment_info.agreed_rate)}</span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Pembayaran: <strong className="text-purple-700 uppercase">{payment_info.payment_status}</strong>
          </span>
        </div>

      </div>
    </div>
  );
}
