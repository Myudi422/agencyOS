"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2, Sparkles, Clock, Instagram, Facebook, Twitter, Youtube, Share2,
  Calendar, Layers, ShieldCheck, Heart, MessageSquare, ExternalLink, Loader2, AlertCircle
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
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-300">Memuat Preview Konten Klien...</p>
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20 shadow-lg">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold font-['Outfit'] mb-1">Link Review Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
          {error || "Link preview mungkin sudah tidak berlaku atau postingan telah dihapus."}
        </p>
        <div className="text-[11px] text-slate-500 font-mono">Shiera Content Portal</div>
      </div>
    );
  }

  const primaryTarget = postData.targets[0] || {
    username: "brand_account",
    name: "Brand Profile",
    platform: "instagram",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-8 px-4 sm:px-6 relative overflow-x-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <header className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/30">
            S
          </div>
          <div>
            <span className="text-xs font-extrabold text-white tracking-wide font-['Outfit'] block">
              {postData.workspace_name}
            </span>
            <span className="text-[10px] text-purple-300 font-medium">Preview Konten Klien</span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
          WA Approval Portal
        </span>
      </header>

      {/* Main Container Card */}
      <main className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 backdrop-blur-xl flex flex-col">
        {/* Schedule Info Box */}
        <div className="p-4 bg-purple-950/40 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-purple-200 font-medium">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <span>✅ Tayang (WIB): <strong>{formatWibDate(postData.scheduled_at)}</strong></span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 uppercase border border-purple-700/50">
            {postData.post_type}
          </span>
        </div>

        {/* Target Platforms Bar */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">Target:</span>
          {postData.targets.length > 0 ? (
            postData.targets.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700/80 shrink-0"
              >
                <span>@{t.username}</span>
                <span className="text-[9px] text-purple-400 capitalize">({t.platform})</span>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-400">Semua Platform Sosial</span>
          )}
        </div>

        {/* Mobile Device Mockup Feed Container */}
        <div className="p-4 space-y-3">
          {/* Feed Profile Header */}
          <div className="flex items-center gap-3">
            {primaryTarget.avatar_url ? (
              <img src={primaryTarget.avatar_url} className="w-10 h-10 rounded-full border border-slate-700 object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-sm flex items-center justify-center border border-slate-700">
                {primaryTarget.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1">
                @{primaryTarget.username}
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </p>
              <p className="text-[10px] text-slate-400">{primaryTarget.name}</p>
            </div>
          </div>

          {/* Media Player / Carousel Box */}
          {postData.media_urls && postData.media_urls.length > 0 ? (
            <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-inner group">
              <img
                src={postData.media_urls[0]}
                alt="Post Media Preview"
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.target.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop";
                }}
              />
              {postData.media_urls.length > 1 && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                  1/{postData.media_urls.length} Slides
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-850 border border-slate-800 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Text-only Post (Tanpa Media Lampiran)</p>
            </div>
          )}

          {/* Social Stats Action Preview */}
          <div className="flex items-center justify-between text-xs text-slate-400 py-1 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-pink-400"><Heart className="w-4 h-4 fill-pink-400/20" /> Like</span>
              <span className="flex items-center gap-1 text-slate-300"><MessageSquare className="w-4 h-4" /> Komen</span>
              <span className="flex items-center gap-1 text-slate-300"><Share2 className="w-4 h-4" /> Share</span>
            </div>
            <span className="text-[10px] text-purple-400 font-bold">Mockup Feed</span>
          </div>

          {/* Caption Box */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              <strong className="text-white mr-1.5">@{primaryTarget.username}</strong>
              {postData.caption || "(Tanpa Caption)"}
            </p>
            {postData.hashtags && (
              <p className="text-xs text-purple-400 font-medium leading-relaxed">
                {postData.hashtags.startsWith("#") ? postData.hashtags : `#${postData.hashtags}`}
              </p>
            )}
          </div>
        </div>

        {/* ACC Action Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {isApproved ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-1.5 animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-emerald-300 font-['Outfit']">Postingan Berhasil Di-ACC!</h3>
              <p className="text-[11px] text-emerald-200/80 max-w-xs mx-auto leading-relaxed">
                Konten ini telah disetujui dan otomatis masuk ke antrean tayang sesuai jadwal ({formatWibDate(postData.scheduled_at)}). Terima kasih!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleApproveContent}
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses ACC...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>ACC &amp; Izinkan Tayang Otomatis</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Sekali klik ACC, postingan akan dijadwalkan langsung tanpa perlu konfirmasi manual lagi.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-[11px] text-slate-500 font-mono">
        Powered by Shiera OS • Client Content Review Portal
      </footer>
    </div>
  );
}
