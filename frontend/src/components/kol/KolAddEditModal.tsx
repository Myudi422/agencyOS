"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, User, Phone, Mail, Instagram, Users2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface KolAddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kolToEdit?: any | null;
}

export default function KolAddEditModal({
  isOpen,
  onClose,
  onSuccess,
  kolToEdit,
}: KolAddEditModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [niche, setNiche] = useState("");
  const [tier, setTier] = useState("micro");
  const [followersCount, setFollowersCount] = useState<number | "">(0);
  const [engagementRate, setEngagementRate] = useState<number | "">(0);
  const [avgViews, setAvgViews] = useState<number | "">("");
  const [contactName, setContactName] = useState("");
  const [contactWa, setContactWa] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [igReelsRate, setIgReelsRate] = useState<number | "">("");
  const [tiktokRate, setTiktokRate] = useState<number | "">("");
  const [youtubeRate, setYoutubeRate] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (kolToEdit) {
      setName(kolToEdit.name || "");
      setUsername(kolToEdit.username || "");
      setPlatform(kolToEdit.primary_platform || "instagram");
      setNiche(kolToEdit.niche || "");
      setTier(kolToEdit.tier || "micro");
      setFollowersCount(kolToEdit.followers_count || 0);
      setEngagementRate(kolToEdit.engagement_rate || 0);
      setAvgViews(kolToEdit.avg_views || "");
      setContactName(kolToEdit.contact_name || "");
      setContactWa(kolToEdit.contact_wa || "");
      setContactEmail(kolToEdit.contact_email || "");
      setProfilePicUrl(kolToEdit.profile_pic_url || "");
      setNotes(kolToEdit.notes || "");

      const rc = kolToEdit.rate_card || {};
      setIgReelsRate(rc.ig_reels || "");
      setTiktokRate(rc.tiktok_video || "");
      setYoutubeRate(rc.youtube_video || "");
    } else {
      setName("");
      setUsername("");
      setPlatform("instagram");
      setNiche("");
      setTier("micro");
      setFollowersCount(0);
      setEngagementRate(0);
      setAvgViews("");
      setContactName("");
      setContactWa("");
      setContactEmail("");
      setProfilePicUrl("");
      setNotes("");
      setIgReelsRate("");
      setTiktokRate("");
      setYoutubeRate("");
    }
    setError("");
  }, [kolToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setError("Nama dan Username KOL wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    const rateCard: Record<string, number> = {};
    if (igReelsRate !== "") rateCard["ig_reels"] = Number(igReelsRate);
    if (tiktokRate !== "") rateCard["tiktok_video"] = Number(tiktokRate);
    if (youtubeRate !== "") rateCard["youtube_video"] = Number(youtubeRate);

    const payload = {
      name: name.trim(),
      username: username.trim().replace(/^@/, "").toLowerCase(),
      primary_platform: platform,
      niche: niche.trim() || null,
      tier,
      followers_count: Number(followersCount) || 0,
      engagement_rate: Number(engagementRate) || 0.0,
      avg_views: avgViews !== "" ? Number(avgViews) : null,
      contact_name: contactName.trim() || null,
      contact_wa: contactWa.trim() || null,
      contact_email: contactEmail.trim() || null,
      rate_card: rateCard,
      profile_pic_url: profilePicUrl.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      if (kolToEdit) {
        await fetchApi(`/kol/profiles/${kolToEdit.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/kol/profiles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data KOL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
      />

      <div className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users2 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {kolToEdit ? "Edit Profil KOL" : "Tambah Profil KOL Baru"}
              </h3>
              <p className="text-[11px] text-slate-500">Database master influencer &amp; rate card</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap / Brand <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rian Arifin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username / Handle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@rian_arifin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          {/* Platform, Niche, Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Platform Utama</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="x">X (Twitter)</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Niche / Kategori</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Beauty, Tech, Lifestyle"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="nano">Nano (&lt;10k)</option>
                <option value="micro">Micro (10k-100k)</option>
                <option value="macro">Macro (100k-1M)</option>
                <option value="mega">Mega (&gt;1M)</option>
              </select>
            </div>
          </div>

          {/* Stats: Followers, ER%, Avg Views */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Followers</label>
              <input
                type="number"
                value={followersCount}
                onChange={(e) => setFollowersCount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="45000"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Engagement Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={engagementRate}
                onChange={(e) => setEngagementRate(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="3.5"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Avg Views Video</label>
              <input
                type="number"
                value={avgViews}
                onChange={(e) => setAvgViews(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="12000"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kontak PIC / Manajer</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nama PIC"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              />
              <input
                type="text"
                value={contactWa}
                onChange={(e) => setContactWa(e.target.value)}
                placeholder="No WA (628...)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email contact"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              />
            </div>
          </div>

          {/* Rate Card Estimates */}
          <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 space-y-3">
            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Estimasi Rate Card (Rp)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-purple-700 font-semibold block mb-1">IG Reels</span>
                <input
                  type="number"
                  value={igReelsRate}
                  onChange={(e) => setIgReelsRate(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="750000"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-purple-700 font-semibold block mb-1">TikTok Video</span>
                <input
                  type="number"
                  value={tiktokRate}
                  onChange={(e) => setTiktokRate(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="1000000"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-purple-700 font-semibold block mb-1">YouTube Video</span>
                <input
                  type="number"
                  value={youtubeRate}
                  onChange={(e) => setYoutubeRate(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="2500000"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold bg-white"
                />
              </div>
            </div>
          </div>

          {/* Avatar URL & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Avatar / Foto URL</label>
              <input
                type="url"
                value={profilePicUrl}
                onChange={(e) => setProfilePicUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Internal</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Response cepat, profesional..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{kolToEdit ? "Simpan Profil" : "Tambah ke Database"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
