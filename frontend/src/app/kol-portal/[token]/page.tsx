"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ExternalLink, CheckCircle2, Send, Hash, Loader2, Check, Copy,
  Lock, BarChart2, Eye, Heart, MessageCircle, Share2, Users, Clock
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const DELIVERABLE_STATUS_BADGES: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  pending: { label: "Belum Dikirim", bg: "bg-slate-100", text: "text-slate-600", icon: null },
  submitted: { label: "Menunggu Review Agency ⏳", bg: "bg-blue-100", text: "text-blue-800", icon: null },
  approved: { label: "Disetujui ✅", bg: "bg-emerald-100", text: "text-emerald-800", icon: null },
  revision_requested: { label: "Perlu Revisi ⚠️", bg: "bg-amber-100", text: "text-amber-800", icon: null },
  rejected: { label: "Ditolak ❌", bg: "bg-red-100", text: "text-red-800", icon: null },
};

export default function PublicKolPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Submit content modal
  const [submittingDeliverable, setSubmittingDeliverable] = useState<any | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [inputNotes, setInputNotes] = useState("");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Submit stats modal
  const [statsDeliverable, setStatsDeliverable] = useState<any | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsSuccess, setStatsSuccess] = useState("");
  const [statViews, setStatViews] = useState<number | "">("");
  const [statLikes, setStatLikes] = useState<number | "">("");
  const [statComments, setStatComments] = useState<number | "">("");
  const [statShares, setStatShares] = useState<number | "">("");
  const [statReach, setStatReach] = useState<number | "">("");
  const [statPeriodDays, setStatPeriodDays] = useState<number | "">(7);

  const [copied, setCopied] = useState(false);

  const fetchPortalData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/kol/public-portal/${token}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Link portal tidak valid.");
      }
      setPortalData(await res.json());
    } catch (err: any) {
      setError(err.message || "Gagal memuat portal KOL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPortalData();
  }, [token]);

  const handleOpenSubmitModal = (d: any) => {
    setSubmittingDeliverable(d);
    setInputUrl(d.content_url || "");
    setInputNotes("");
    setSubmitSuccess("");
    setIsSubmitModalOpen(true);
  };

  const handleOpenStatsModal = (d: any) => {
    setStatsDeliverable(d);
    setStatViews(d.stats?.views ?? "");
    setStatLikes(d.stats?.likes ?? "");
    setStatComments(d.stats?.comments ?? "");
    setStatShares(d.stats?.shares ?? "");
    setStatReach(d.stats?.reach ?? "");
    setStatPeriodDays(d.stats?.period_days ?? 7);
    setStatsSuccess("");
    setIsStatsModalOpen(true);
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setSubmitLoading(true);
    setSubmitSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/kol/public-portal/${token}/submit-deliverable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverable_id: submittingDeliverable.id,
          content_url: inputUrl.trim(),
          review_notes: inputNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Gagal mengirim link konten.");
      }
      setSubmitSuccess("Link konten berhasil dikirim ke agency!");
      setTimeout(() => { setIsSubmitModalOpen(false); fetchPortalData(); }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatsLoading(true);
    setStatsSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/kol/public-portal/${token}/submit-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverable_id: statsDeliverable.id,
          stat_views: statViews !== "" ? Number(statViews) : null,
          stat_likes: statLikes !== "" ? Number(statLikes) : null,
          stat_comments: statComments !== "" ? Number(statComments) : null,
          stat_shares: statShares !== "" ? Number(statShares) : null,
          stat_reach: statReach !== "" ? Number(statReach) : null,
          stat_period_days: statPeriodDays !== "" ? Number(statPeriodDays) : 7,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Gagal mengirim statistik.");
      }
      setStatsSuccess("Statistik berhasil dilaporkan! Terima kasih.");
      setTimeout(() => { setIsStatsModalOpen(false); fetchPortalData(); }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const formatNum = (val?: number | null) =>
    val != null ? new Intl.NumberFormat("id-ID").format(val) : "—";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Memuat Portal Influencer...</p>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto text-2xl">⚠️</div>
          <h2 className="text-base font-extrabold text-slate-900">Portal Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">{error || "Link portal ini tidak valid atau sudah tidak aktif."}</p>
        </div>
      </div>
    );
  }

  const { kol, campaign, deliverables, payment_info } = portalData;

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 font-sans antialiased text-slate-900">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Top Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/20">
                🤝
              </span>
              <div>
                <span className="text-[10px] font-extrabold text-purple-700 tracking-wider uppercase">Portal Influencer Partner</span>
                <p className="text-xs font-bold text-slate-700">{campaign.agency_name}</p>
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Tersalin!" : "Salin Link Portal"}</span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{campaign.name}</h1>
              {campaign.brand_account && (
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {campaign.brand_account}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Halo <strong className="text-purple-700">@{kol.username}</strong> ({kol.name}), berikut adalah tugas konten Anda. Kirim link postingan & statistik setelah tayang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {campaign.hashtag_mandatory && (
              <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-bold flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-purple-600" />
                <span>{campaign.hashtag_mandatory}</span>
              </div>
            )}
            {campaign.campaign_brief_url && (
              <a
                href={campaign.campaign_brief_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Brief Campaign</span>
              </a>
            )}
          </div>
        </div>

        {/* Deliverables List */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Checklist Konten ({deliverables.length})
          </h2>

          {deliverables.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Belum ada deliverable yang ditugaskan.
            </div>
          ) : (
            <div className="space-y-4">
              {deliverables.map((d: any) => {
                const badge = DELIVERABLE_STATUS_BADGES[d.status] || DELIVERABLE_STATUS_BADGES.pending;
                const isLocked = d.is_locked;
                const hasStats = d.stats && (d.stats.views != null || d.stats.likes != null);

                return (
                  <div
                    key={d.id}
                    className={`rounded-2xl border p-4 space-y-3 transition-all ${
                      isLocked
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200/90 bg-white"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase bg-purple-100 text-purple-800">
                            {d.deliverable_type}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                          {isLocked && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Dikunci
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

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {!isLocked && (
                          <button
                            onClick={() => handleOpenSubmitModal(d)}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{d.content_url ? "Edit Link" : "Kirim Link"}</span>
                          </button>
                        )}
                        {/* Stat report always accessible if content has been submitted */}
                        {(d.status === "submitted" || d.status === "approved" || d.status === "revision_requested") && (
                          <button
                            onClick={() => handleOpenStatsModal(d)}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>{hasStats ? "Update Statistik" : "Lapor Statistik"}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content URL display */}
                    {d.content_url && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-mono truncate">{d.content_url}</span>
                        <a
                          href={d.content_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-700 font-bold hover:underline shrink-0 flex items-center gap-1"
                        >
                          <span>Lihat</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Stats summary if available */}
                    {hasStats && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        {[
                          { icon: <Eye className="w-3 h-3" />, label: "Views", val: d.stats.views },
                          { icon: <Heart className="w-3 h-3" />, label: "Likes", val: d.stats.likes },
                          { icon: <MessageCircle className="w-3 h-3" />, label: "Komentar", val: d.stats.comments },
                          { icon: <Share2 className="w-3 h-3" />, label: "Shares", val: d.stats.shares },
                          { icon: <Users className="w-3 h-3" />, label: "Reach", val: d.stats.reach },
                          { icon: <Clock className="w-3 h-3" />, label: "Periode", val: d.stats.period_days ? `${d.stats.period_days}h` : null },
                        ].map((s) => (
                          <div key={s.label} className="text-center">
                            <span className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
                              {s.icon}{s.label}
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 block">{formatNum(s.val as number)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Approved locked message */}
                    {isLocked && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Konten ini telah disetujui agency. Anda masih bisa melaporkan statistik terbaru jika diperlukan.</span>
                      </div>
                    )}

                    {/* Review notes from agency */}
                    {d.review_notes && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <strong className="font-bold block mb-0.5">Catatan dari Agency:</strong>
                        <p>{d.review_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Footer */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Kesepakatan Fee</span>
            <span className="text-sm font-extrabold text-slate-900">{formatRupiah(payment_info.agreed_rate)}</span>
          </div>
          <span className="text-slate-500">
            Status Pembayaran: <strong className="text-purple-700 font-bold uppercase">{payment_info.payment_status}</strong>
          </span>
        </div>
      </div>

      {/* ─── Modal: Kirim Link Konten ─── */}
      {isSubmitModalOpen && submittingDeliverable && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div onClick={() => setIsSubmitModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Kirim Bukti Postingan</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{submittingDeliverable.title}</p>
              </div>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            {submitSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Link Postingan (IG Reels / TikTok / YouTube) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Tambahan (Opsional)</label>
                  <textarea
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    placeholder="Misal: Sudah ditayangkan pukul 19.00 WIB..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setIsSubmitModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Batal</button>
                  <button
                    type="submit"
                    disabled={submitLoading || !inputUrl.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Kirim Sekarang</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── Modal: Lapor Statistik ─── */}
      {isStatsModalOpen && statsDeliverable && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div onClick={() => setIsStatsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-600" />
                  Laporan Statistik Postingan
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{statsDeliverable.title}</p>
              </div>
              <button onClick={() => setIsStatsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            {statsSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>{statsSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitStats} className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
                  <strong>Panduan:</strong> Screenshot insight dari aplikasi Instagram/TikTok/YouTube, lalu masukkan angkanya di bawah. Statistik diambil <strong>{statPeriodDays} hari setelah posting</strong>.
                </div>

                {/* Period days */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Statistik Diambil Setelah Berapa Hari Posting?
                  </label>
                  <select
                    value={statPeriodDays}
                    onChange={(e) => setStatPeriodDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value={3}>3 hari</option>
                    <option value={7}>7 hari (1 minggu)</option>
                    <option value={14}>14 hari (2 minggu)</option>
                    <option value={30}>30 hari (1 bulan)</option>
                  </select>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Eye className="w-3.5 h-3.5 text-slate-400" />, label: "Views / Tayangan", val: statViews, setter: setStatViews },
                    { icon: <Users className="w-3.5 h-3.5 text-slate-400" />, label: "Reach / Jangkauan", val: statReach, setter: setStatReach },
                    { icon: <Heart className="w-3.5 h-3.5 text-rose-400" />, label: "Likes / Suka", val: statLikes, setter: setStatLikes },
                    { icon: <MessageCircle className="w-3.5 h-3.5 text-blue-400" />, label: "Komentar", val: statComments, setter: setStatComments },
                    { icon: <Share2 className="w-3.5 h-3.5 text-purple-400" />, label: "Shares / Bagikan", val: statShares, setter: setStatShares },
                  ].map((s) => (
                    <div key={s.label}>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        {s.icon}{s.label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={s.val}
                        onChange={(e) => s.setter(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setIsStatsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Batal</button>
                  <button
                    type="submit"
                    disabled={statsLoading}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {statsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Kirim Statistik</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
