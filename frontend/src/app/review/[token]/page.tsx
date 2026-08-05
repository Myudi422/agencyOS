"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Clock, ShieldCheck, Loader2, AlertCircle, FileText, Layers
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

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative overflow-x-hidden font-sans">
      {/* Background Soft Purple Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-200/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-3xl mb-8 flex items-center justify-between z-10 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-purple-500/20">
            S
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              {postData.workspace_name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">Content Preview &amp; Media Report</p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Report Mode</span>
        </span>
      </header>

      {/* Clean White Airbnb Style Container Card */}
      <main className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-md transition-all z-10 space-y-6 p-6 sm:p-8">
        
        {/* Schedule & Target Accounts Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-semibold">
            <Clock className="w-5 h-5 text-purple-600 shrink-0" />
            <span>✅ Rencana Tayang (WIB): <strong className="text-purple-700 font-bold">{formatWibDate(postData.scheduled_at)}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {postData.targets.map((t, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/80 flex items-center gap-1.5"
              >
                <span>@{t.username}</span>
                <span className="text-[10px] text-purple-500 capitalize">({t.platform})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Media Showcase (Clean Gallery) */}
        {postData.media_urls && postData.media_urls.length > 0 && (
          <div className="space-y-3">
            <div className="relative aspect-video sm:aspect-[16/9] w-full rounded-2xl bg-slate-900 overflow-hidden border border-slate-200 shadow-xs group">
              <img
                src={postData.media_urls[activeMediaIdx] || postData.media_urls[0]}
                alt="Post Media Showcase"
                className="w-full h-full object-contain bg-slate-900"
                onError={(e: any) => {
                  e.target.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop";
                }}
              />
              {postData.media_urls.length > 1 && (
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold border border-white/20">
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
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeMediaIdx === idx
                        ? "border-purple-600 ring-2 ring-purple-500/30 opacity-100 scale-105"
                        : "border-slate-200 opacity-60 hover:opacity-100"
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
        <div className="space-y-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-['Outfit']">Teks Caption &amp; Content Copy</h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold uppercase border border-purple-200">
              {postData.post_type}
            </span>
          </div>

          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
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
        Powered by Shiera OS • Content Review &amp; Report Portal
      </footer>
    </div>
  );
}
