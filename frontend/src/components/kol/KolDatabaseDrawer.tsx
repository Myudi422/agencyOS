"use client";

import React, { useState, useEffect } from "react";
import {
  X, Search, Plus, Edit, Trash2, ShieldAlert, Phone, Mail, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import KolAddEditModal from "./KolAddEditModal";

interface KolProfileItem {
  id: string;
  name: string;
  username: string;
  primary_platform: string;
  niche?: string;
  tier: string;
  followers_count: number;
  engagement_rate: number;
  contact_name?: string;
  contact_wa?: string;
  contact_email?: string;
  rate_card?: Record<string, number>;
  profile_pic_url?: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  campaigns_count: number;
}

interface KolDatabaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIER_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  nano: { label: "Nano (<10k)", bg: "bg-slate-100", text: "text-slate-600" },
  micro: { label: "Micro (10k-100k)", bg: "bg-blue-100", text: "text-blue-700" },
  macro: { label: "Macro (100k-1M)", bg: "bg-purple-100", text: "text-purple-700" },
  mega: { label: "Mega (>1M)", bg: "bg-amber-100", text: "text-amber-700" },
};

export default function KolDatabaseDrawer({ isOpen, onClose }: KolDatabaseDrawerProps) {
  const [profiles, setProfiles] = useState<KolProfileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<KolProfileItem | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (selectedTier) queryParams.set("tier", selectedTier);
      if (selectedPlatform) queryParams.set("platform", selectedPlatform);

      const res = await fetchApi<any>(`/kol/profiles?${queryParams.toString()}`);
      setProfiles(res.profiles || []);
    } catch (err) {
      console.error("Gagal mengambil data profiles KOL:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen, search, selectedTier, selectedPlatform]);

  if (!isOpen) return null;

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Hapus KOL @${username} dari database master?`)) return;
    try {
      await fetchApi(`/kol/profiles/${id}`, { method: "DELETE" });
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus KOL.");
    }
  };

  const handleToggleBlacklist = async (profile: KolProfileItem) => {
    const nextStatus = !profile.is_blacklisted;
    let reason = "";
    if (nextStatus) {
      reason = prompt(`Masukkan alasan mem-blacklist KOL @${profile.username}:`) || "Tidak memenuhi kesepakatan";
    }

    try {
      await fetchApi(`/kol/profiles/${profile.id}/blacklist`, {
        method: "POST",
        body: JSON.stringify({ is_blacklisted: nextStatus, blacklist_reason: reason }),
      });
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status blacklist.");
    }
  };

  const formatK = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>👤 Master KOL Database</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                  {profiles.length} Profil
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Koleksi influencer &amp; rate card untuk seluruh workspace
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setProfileToEdit(null); setIsAddModalOpen(true); }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah KOL</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/30 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau @username..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">Semua Tier</option>
                <option value="nano">Nano (&lt;10k)</option>
                <option value="micro">Micro (10k-100k)</option>
                <option value="macro">Macro (100k-1M)</option>
                <option value="mega">Mega (&gt;1M)</option>
              </select>

              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">Semua Platform</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="x">X (Twitter)</option>
              </select>
            </div>
          </div>

          {/* Profiles List */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 px-4">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Tidak ada data KOL ditemukan</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Coba ubah kata kunci pencarian atau klik "+ Tambah KOL".
                </p>
              </div>
            ) : (
              profiles.map((p) => {
                const tierInfo = TIER_BADGES[p.tier] || TIER_BADGES.micro;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      p.is_blacklisted
                        ? "border-red-200 bg-red-50/40"
                        : "border-slate-200/90 bg-white hover:border-purple-200 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {p.profile_pic_url ? (
                          <img src={p.profile_pic_url} className="w-10 h-10 rounded-2xl object-cover border border-slate-200" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-extrabold text-slate-900">{p.name}</h4>
                            <span className="text-xs font-semibold text-purple-700">@{p.username}</span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${tierInfo.bg} ${tierInfo.text}`}>
                              {tierInfo.label}
                            </span>
                            {p.niche && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md font-medium">
                                {p.niche}
                              </span>
                            )}
                            {p.is_blacklisted && (
                              <span className="text-[9px] px-2 py-0.2 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                                Blacklisted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setProfileToEdit(p); setIsAddModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleBlacklist(p)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.is_blacklisted
                              ? "text-red-600 bg-red-100 hover:bg-red-200"
                              : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          }`}
                          title={p.is_blacklisted ? "Lepas Blacklist" : "Blacklist KOL"}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.username)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus KOL"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                      <div>
                        <span className="text-[9px] text-slate-400 font-medium block">Followers</span>
                        <span className="text-xs font-bold text-slate-800">{formatK(p.followers_count)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-medium block">Engagement Rate</span>
                        <span className="text-xs font-bold text-emerald-600">{p.engagement_rate}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-medium block">Kontak WA</span>
                        <span className="text-xs font-medium text-slate-700">{p.contact_wa || "-"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      <KolAddEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchProfiles()}
        kolToEdit={profileToEdit}
      />
    </div>
  );
}
