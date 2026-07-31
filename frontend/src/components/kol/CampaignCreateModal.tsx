"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Sparkles, Calendar, DollarSign, Link as LinkIcon, Hash } from "lucide-react";
import { AccountItem } from "./KolAccountSelector";
import { fetchApi } from "@/lib/api";

interface CampaignCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: AccountItem[];
  defaultSocialAccountId?: string | null;
  campaignToEdit?: any | null;
}

export default function CampaignCreateModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  defaultSocialAccountId,
  campaignToEdit,
}: CampaignCreateModalProps) {
  const [socialAccountId, setSocialAccountId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalBudget, setTotalBudget] = useState<number | "">(0);
  const [estimatedRevenue, setEstimatedRevenue] = useState<number | "">("");
  const [briefUrl, setBriefUrl] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (campaignToEdit) {
      setSocialAccountId(campaignToEdit.social_account_id || "");
      setName(campaignToEdit.name || "");
      setDescription(campaignToEdit.description || "");
      setStatus(campaignToEdit.status || "draft");
      setStartDate(campaignToEdit.start_date || "");
      setEndDate(campaignToEdit.end_date || "");
      setTotalBudget(campaignToEdit.total_budget || 0);
      setEstimatedRevenue(campaignToEdit.estimated_revenue || "");
      setBriefUrl(campaignToEdit.campaign_brief_url || "");
      setHashtag(campaignToEdit.hashtag_mandatory || "");
    } else {
      setSocialAccountId(defaultSocialAccountId || (accounts[0]?.id || ""));
      setName("");
      setDescription("");
      setStatus("draft");
      setStartDate("");
      setEndDate("");
      setTotalBudget(0);
      setEstimatedRevenue("");
      setBriefUrl("");
      setHashtag("");
    }
    setError("");
  }, [campaignToEdit, defaultSocialAccountId, isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama campaign wajib diisi.");
      return;
    }
    if (!socialAccountId) {
      setError("Pilih akun platform terhubung.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      social_account_id: socialAccountId,
      name: name.trim(),
      description: description.trim() || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      total_budget: Number(totalBudget) || 0,
      estimated_revenue: estimatedRevenue !== "" ? Number(estimatedRevenue) : null,
      campaign_brief_url: briefUrl.trim() || null,
      hashtag_mandatory: hashtag.trim() || null,
    };

    try {
      if (campaignToEdit) {
        await fetchApi(`/kol/campaigns/${campaignToEdit.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/kol/campaigns", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan campaign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {campaignToEdit ? "Edit Campaign KOL" : "Buat Campaign KOL Baru"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Organisir kampanye influencer per akun platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Social Account Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Akun Terhubung <span className="text-red-500">*</span>
            </label>
            <select
              value={socialAccountId}
              onChange={(e) => setSocialAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="" disabled>-- Pilih Akun --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  @{acc.username} ({acc.platform})
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Campaign <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Ramadan Mega Promo 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Campaign</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="draft">Draft (Perencanaan)</option>
              <option value="active">Active (Berjalan)</option>
              <option value="completed">Completed (Selesai)</option>
              <option value="paused">Paused (Ditunda)</option>
              <option value="cancelled">Cancelled (Batal)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi / Objectives</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tujuan campaign, KPI, atau catatan internal..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Budget & Revenue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Budget (Rp)</label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="5000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Estimasi Revenue (Rp)</label>
              <input
                type="number"
                value={estimatedRevenue}
                onChange={(e) => setEstimatedRevenue(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="15000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Hashtag & Brief URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Hashtag Wajib</label>
              <input
                type="text"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="#ShieraxBrand"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Link Brief (Drive/Notion)</label>
              <input
                type="url"
                value={briefUrl}
                onChange={(e) => setBriefUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Submit */}
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
              <span>{campaignToEdit ? "Simpan Perubahan" : "Buat Campaign"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
