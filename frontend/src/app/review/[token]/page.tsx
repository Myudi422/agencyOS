"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2, Sparkles, Clock, ShieldCheck, Loader2, AlertCircle, Calendar, Users
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface TargetAccount {
  account_id: string;
  platform: string;
  username: string;
  name: string;
  avatar_url?: string;
}

interface ReviewPostData {
  id: string;
  workspace_name: string;
  post_type: string;
  caption: string;
  hashtags: string;
  media_urls: string[];
  platforms: string[];
  targets: TargetAccount[];
  scheduled_at: string | null;
  status: string;
  created_at: string;
}

export default function PublicClientReviewPage() {
  const params = useParams();
  const token = params?.token as string;

  const [postData, setPostData] = useState<ReviewPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    fetchApi<ReviewPostData>(`/posts/public/review/${token}`)
      .then((data) => {
        setPostData(data);
        if (data.status === "scheduled" || data.status === "publishing" || data.status === "published") {
          setIsApproved(true);
        }
      })
      .catch((err: any) => {
        setError(err.message || "Link preview tidak valid atau postingan tidak ditemukan.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleApproveContent = async () => {
    if (!token || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await fetchApi(`/posts/public/review/${token}/approve`, {
        method: "POST",
      });
      setIsApproved(true);
    } catch (err: any) {
      alert(err.message || "Gagal memproses ACC. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatWibDate = (isoStr?: string | null) => {
    if (!isoStr) return "Tayang Langsung / Segera";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }) + " WIB";
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-300">Memuat Preview Konten...</p>
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20 shadow-lg">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-['Outfit'] mb-1">Link Review Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
          {error || "Link preview mungkin sudah tidak berlaku atau postingan telah dihapus."}
        </p>
        <div className="text-[11px] text-slate-500 font-mono">Shiera OS • Content Approval</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-3xl mb-8 flex items-center justify-between z-10 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-500/30">
            S
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight font-['Outfit']">
              {postData.workspace_name}
            </h1>
            <p className="text-xs text-slate-400">Review &amp; Approval Konten Klien</p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>WA Review Link</span>
        </span>
      </header>

      {/* Clean Main Content Card */}
      <main className="w-full max-w-3xl bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 backdrop-blur-xl space-y-6 p-6 sm:p-8">
        
        {/* Schedule & Target Accounts Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-purple-950/30 border border-purple-800/30">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-purple-200 font-semibold">
            <Clock className="w-5 h-5 text-purple-400 shrink-0" />
            <span>✅ Rencana Tayang (WIB): <strong className="text-white font-mono">{formatWibDate(postData.scheduled_at)}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {postData.targets.map((t, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/80 flex items-center gap-1.5"
              >
                <span>@{t.username}</span>
                <span className="text-[10px] text-purple-400 capitalize">({t.platform})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Media Showcase (Clean Gallery) */}
        {postData.media_urls && postData.media_urls.length > 0 && (
          <div className="space-y-3">
            <div className="relative aspect-video sm:aspect-[16/9] w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-lg group">
              <img
                src={postData.media_urls[activeMediaIdx] || postData.media_urls[0]}
                alt="Post Media Showcase"
                className="w-full h-full object-contain bg-slate-950"
                onError={(e: any) => {
                  e.target.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop";
                }}
              />
              {postData.media_urls.length > 1 && (
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                  {activeMediaIdx + 1} / {postData.media_urls.length} Media
                </div>
              )}
            </div>

            {/* Thumbnail Selectors if multiple media */}
            {postData.media_urls.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
                {postData.media_urls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMediaIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeMediaIdx === idx
                        ? "border-purple-500 ring-2 ring-purple-500/40 opacity-100 scale-105"
                        : "border-slate-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clean Caption Section */}
        <div className="space-y-3 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-['Outfit']">Teks Caption &amp; Content Copy</h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold uppercase">
              {postData.post_type}
            </span>
          </div>

          <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-line font-normal">
            {postData.caption || "(Tanpa Caption)"}
          </p>

          {postData.hashtags && (
            <div className="pt-2 border-t border-slate-800/60">
              <p className="text-xs text-purple-400 font-medium leading-relaxed">
                {postData.hashtags.startsWith("#") ? postData.hashtags : `#${postData.hashtags}`}
              </p>
            </div>
          )}
        </div>

        {/* Big Clean ACC CTA Section */}
        <div className="pt-4 border-t border-slate-800">
          {isApproved ? (
            <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-emerald-300 font-['Outfit']">Postingan Berhasil Di-ACC!</h3>
              <p className="text-xs text-emerald-200/80 max-w-md mx-auto leading-relaxed">
                Konten ini telah disetujui dan secara otomatis masuk ke antrean tayang sesuai jadwal (<strong className="text-emerald-100">{formatWibDate(postData.scheduled_at)}</strong>). Terima kasih!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleApproveContent}
                disabled={isSubmitting}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 text-white font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Memproses ACC...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-white" />
                    <span>ACC &amp; Izinkan Tayang Otomatis</span>
                  </>
                )}
              </button>
              <p className="text-xs text-center text-slate-400">
                Tekan tombol di atas untuk menyetujui postingan ini agar otomatis tayang sesuai jadwal.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Clean Branding Footer */}
      <footer className="mt-8 text-center text-xs text-slate-500 font-mono">
        Powered by Shiera OS • Client Content Review Portal
      </footer>
    </div>
  );
}
