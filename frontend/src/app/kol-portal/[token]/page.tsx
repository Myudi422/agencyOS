"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles, ExternalLink, CheckCircle2, Clock, AlertTriangle, Send, Hash,
  ShieldCheck, Loader2, Check, Copy, Share2
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const DELIVERABLE_STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Belum Dikirim", bg: "bg-slate-100", text: "text-slate-600" },
  submitted: { label: "Menunggu Review Agency ⏳", bg: "bg-blue-100", text: "text-blue-800" },
  approved: { label: "Disetujui ✅", bg: "bg-emerald-100", text: "text-emerald-800" },
  revision_requested: { label: "Ada Revisi ⚠️", bg: "bg-amber-100", text: "text-amber-800" },
  rejected: { label: "Ditolak ❌", bg: "bg-red-100", text: "text-red-800" },
};

export default function PublicKolPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [inputNotes, setInputNotes] = useState("");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

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
      const data = await res.json();
      setPortalData(data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat portal KOL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortalData();
    }
  }, [token]);

  const handleOpenSubmitModal = (deliverable: any) => {
    setSubmittingId(deliverable.id);
    setInputUrl(deliverable.content_url || "");
    setInputNotes("");
    setSubmitSuccess("");
    setIsSubmitModalOpen(true);
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
          deliverable_id: submittingId,
          content_url: inputUrl.trim(),
          review_notes: inputNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Gagal mengirim link konten.");
      }

      setSubmitSuccess("Link konten berhasil dikirim ke agency!");
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        fetchPortalData();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Gagal mengirim link konten.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

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
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto font-bold">
            ⚠️
          </div>
          <h2 className="text-base font-extrabold text-slate-900">Portal Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">{error || "Link portal ini tidak valid atau sudah tidak aktif."}</p>
        </div>
      </div>
    );
  }

  const { kol, campaign, deliverables, payment_info } = portalData;

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 font-sans antialiased text-slate-900">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Top Header / Portal Branding */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/20">
                🤝
              </span>
              <div>
                <span className="text-[10px] font-extrabold text-purple-700 tracking-wider uppercase">
                  Portal Influencer Partner
                </span>
                <p className="text-xs font-bold text-slate-700">{campaign.agency_name}</p>
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Tersalin!" : "Bagikan Link Portal"}</span>
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
              Halo <strong className="text-purple-700">@{kol.username}</strong> ({kol.name}), selamat bergabung di campaign ini! Kirim bukti postingan Anda pada form di bawah ini.
            </p>
          </div>

          {/* Guidelines & Brief URL */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
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
                <span>Lihat Brief Campaign</span>
              </a>
            )}
          </div>
        </div>

        {/* Deliverables Checklist Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Checklist Deliverables Konten ({deliverables.length})</span>
            </h2>
          </div>

          {deliverables.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Belum ada deliverable yang ditugaskan ke Anda.
            </div>
          ) : (
            <div className="space-y-3">
              {deliverables.map((d: any) => {
                const badge = DELIVERABLE_STATUS_BADGES[d.status] || DELIVERABLE_STATUS_BADGES.pending;

                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase bg-purple-100 text-purple-800">
                            {d.deliverable_type}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-800">{d.title}</h3>
                        {d.due_date && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Deadline: {d.due_date}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenSubmitModal(d)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{d.content_url ? "Edit Link Konten" : "Kirim Link Konten"}</span>
                      </button>
                    </div>

                    {/* Content URL status */}
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

                    {/* Review Notes from Agency */}
                    {d.review_notes && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <strong className="block font-bold">Catatan dari Agency:</strong>
                        <p className="mt-0.5">{d.review_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Summary Footer */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Kesepakatan Fee</span>
            <span className="text-sm font-extrabold text-slate-900">{formatRupiah(payment_info.agreed_rate)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Status Pembayaran: <strong className="text-purple-700 font-bold uppercase">{payment_info.payment_status}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Submit Content Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => setIsSubmitModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <div className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Kirim Bukti Postingan Konten</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
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
                    Link Postingan (Instagram Reels / TikTok / YouTube) <span className="text-red-500">*</span>
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
                    placeholder="Misal: Sudah ditayangkan pukul 19:00 WIB..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading || !inputUrl.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 disabled:opacity-50"
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
    </div>
  );
}
