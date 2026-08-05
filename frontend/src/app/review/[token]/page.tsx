"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Clock, ShieldCheck, Loader2, AlertCircle, FileText, Sparkles, Play, Film, Image as ImageIcon
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
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    fetchApi<ReviewPostData>(`/posts/public/review/${token}`)
      .then((data) => {
        setPostData(data);
      })
      .catch((err: any) => {
        setError(err.message || "Link preview tidak valid atau postingan tidak ditemukan.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

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

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") || lower.includes("video") || lower.includes("reel");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Memuat Content Preview...</p>
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200 shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-['Outfit'] text-slate-900 mb-1">Link Review Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
          {error || "Link preview mungkin sudah tidak berlaku atau postingan telah dihapus."}
        </p>
        <div className="text-[11px] text-slate-400 font-mono">Shiera OS • Content Portal</div>
      </div>
    );
  }

  const currentMediaUrl = postData.media_urls?.[activeMediaIdx] || postData.media_urls?.[0];
  const isCurrentVideo = isVideoUrl(currentMediaUrl);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col items-center py-6 sm:py-10 px-3 sm:px-6 relative overflow-x-hidden font-sans">
      {/* Background Soft Purple Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-200/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Premium Shiera Header Bar */}
      <header className="w-full max-w-3xl mb-6 sm:mb-8 flex items-center justify-between z-10 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          {/* Official Shiera Logo Badge */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-['Outfit']">
                {postData.workspace_name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">Content Review &amp; Visual Report</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex px-3.5 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200/80 text-xs font-bold items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Verified Preview</span>
          </span>
        </div>
      </header>

      {/* Clean White Airbnb Style Container Card */}
      <main className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all z-10 space-y-5 p-4 sm:p-8">
        
        {/* Schedule & Target Accounts Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-semibold">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
            <span>✅ Rencana Tayang (WIB): <strong className="text-purple-700 font-bold">{formatWibDate(postData.scheduled_at)}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {postData.targets.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/80 flex items-center gap-1.5"
              >
                <span>@{t.username}</span>
                <span className="text-[10px] text-purple-500 capitalize">({t.platform})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Media Showcase (Responsive Image & Video Player) */}
        {postData.media_urls && postData.media_urls.length > 0 && (
          <div className="space-y-3">
            <div className="relative w-full rounded-2xl sm:rounded-3xl bg-slate-950 overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center min-h-[220px] max-h-[70vh]">
              {isCurrentVideo ? (
                <video
                  src={currentMediaUrl}
                  controls
                  className="w-full max-h-[70vh] object-contain bg-slate-950"
                  preload="metadata"
                />
              ) : (
                <img
                  src={currentMediaUrl}
                  alt="Post Media Preview"
                  className="w-full max-h-[70vh] object-contain bg-slate-950"
                  onError={(e: any) => {
                    e.target.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop";
                  }}
                />
              )}
              {postData.media_urls.length > 1 && (
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                  {activeMediaIdx + 1} / {postData.media_urls.length} Media
                </div>
              )}
            </div>

            {/* Thumbnail Selectors for Multi-Media / Carousel */}
            {postData.media_urls.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
                {postData.media_urls.map((url, idx) => {
                  const isVid = isVideoUrl(url);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMediaIdx(idx)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        activeMediaIdx === idx
                          ? "border-purple-600 ring-2 ring-purple-500/30 opacity-100 scale-105"
                          : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {isVid ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                          <Film className="w-5 h-5 text-purple-400" />
                        </div>
                      ) : (
                        <img src={url} className="w-full h-full object-cover" alt="" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Clean Caption Section */}
        <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-['Outfit'] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Teks Caption &amp; Content Copy</span>
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold uppercase border border-purple-200">
              {postData.post_type}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
            {postData.caption || "(Tanpa Caption)"}
          </p>

          {postData.hashtags && (
            <div className="pt-2 border-t border-slate-200/80">
              <p className="text-xs text-purple-600 font-semibold leading-relaxed">
                {postData.hashtags.startsWith("#") ? postData.hashtags : `#${postData.hashtags}`}
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Clean Branding Footer */}
      <footer className="mt-8 text-center text-xs text-slate-400 font-mono">
        Powered by Shiera • Content Review Portal
      </footer>
    </div>
  );
}
