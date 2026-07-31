"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Plus, Search, UserCheck } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface KolAddToCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaignId: string;
}

export default function KolAddToCampaignModal({
  isOpen,
  onClose,
  onSuccess,
  campaignId,
}: KolAddToCampaignModalProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [agreedRate, setAgreedRate] = useState<number | "">(0);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [paidAmount, setPaidAmount] = useState<number | "">(0);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingProfiles, setFetchingProfiles] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFetchingProfiles(true);
      fetchApi<any>("/kol/profiles?blacklisted=false")
        .then((res) => {
          setProfiles(res.profiles || []);
          if (res.profiles && res.profiles.length > 0) {
            setSelectedProfileId(res.profiles[0].id);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setFetchingProfiles(false));

      setAgreedRate(0);
      setPaymentStatus("unpaid");
      setPaidAmount(0);
      setNotes("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    const prof = profiles.find((p) => p.id === id);
    if (prof && prof.rate_card) {
      const rates = Object.values(prof.rate_card as Record<string, number>);
      if (rates.length > 0) {
        setAgreedRate(rates[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) {
      setError("Pilih KOL terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await fetchApi(`/kol/campaigns/${campaignId}/kols`, {
        method: "POST",
        body: JSON.stringify({
          kol_profile_id: selectedProfileId,
          agreed_rate: Number(agreedRate) || 0,
          payment_status: paymentStatus,
          paid_amount: Number(paidAmount) || 0,
          notes: notes.trim() || null,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menambahkan KOL ke campaign.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
      />

      <div className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Tambah KOL ke Campaign</h3>
            <p className="text-[11px] text-slate-500">Pilih dari database master KOL workspace</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Search & Select KOL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Profil KOL <span className="text-red-500">*</span>
            </label>

            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari KOL..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
              />
            </div>

            {fetchingProfiles ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading KOL database...</div>
            ) : filteredProfiles.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                Belum ada KOL di database. Silakan tambah di KOL Database dahulu.
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-white">
                {filteredProfiles.map((p) => {
                  const isSelected = selectedProfileId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProfile(p.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? "bg-purple-100 border border-purple-300 font-bold text-purple-900"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-[10px]">
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs">{p.name}</p>
                          <p className="text-[10px] text-slate-500">@{p.username} ({p.tier})</p>
                        </div>
                      </div>
                      {isSelected && <UserCheck className="w-4 h-4 text-purple-700" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agreed Rate & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarif Disepakati (Rp)</label>
              <input
                type="number"
                value={agreedRate}
                onChange={(e) => setAgreedRate(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="750000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Pembayaran</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              >
                <option value="unpaid">Belum Dibayar (Unpaid)</option>
                <option value="partial">Dibayar Sebagian (Partial)</option>
                <option value="paid">Lunas (Paid)</option>
              </select>
            </div>
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Jumlah Sudah Dibayar (Rp)</label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="350000"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Kesepakatan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan nego, nomor invoice, dll..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProfileId}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Tambahkan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
