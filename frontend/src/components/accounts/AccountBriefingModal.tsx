"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Sparkles, FileText, Check, Plus, Trash2, HelpCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "@/store/useToastStore";

interface AccountBriefingModalProps {
  account: {
    id: string;
    username: string;
    name?: string;
    platform: string;
    briefing?: any;
  };
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_PILLARS = [
  "Edukasi & Tips",
  "Promosi & Penjualan",
  "Meme & Entertainment",
  "Storytelling & Brand Story",
  "Behind The Scene",
  "Review & Testimoni"
];

export default function AccountBriefingModal({ account, onClose, onSaved }: AccountBriefingModalProps) {
  const [brandName, setBrandName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("Friendly, Edukatif, & Modern");
  const [contentPillars, setContentPillars] = useState<string[]>([]);
  const [newPillarInput, setNewPillarInput] = useState("");
  const [dosAndDonts, setDosAndDonts] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (account.briefing) {
      setBrandName(account.briefing.brand_name || account.name || account.username || "");
      setBusinessDescription(account.briefing.business_description || "");
      setTargetAudience(account.briefing.target_audience || "");
      setToneOfVoice(account.briefing.tone_of_voice || "Friendly, Edukatif, & Modern");
      setContentPillars(account.briefing.content_pillars || DEFAULT_PILLARS.slice(0, 3));
      setDosAndDonts(account.briefing.dos_and_donts || "");
    } else {
      setBrandName(account.name || account.username || "");
      setContentPillars(DEFAULT_PILLARS.slice(0, 3));
    }
  }, [account]);

  const handleTogglePillar = (pillar: string) => {
    if (contentPillars.includes(pillar)) {
      setContentPillars(prev => prev.filter(p => p !== pillar));
    } else {
      setContentPillars(prev => [...prev, pillar]);
    }
  };

  const handleAddCustomPillar = () => {
    const val = newPillarInput.trim();
    if (!val) return;
    if (!contentPillars.includes(val)) {
      setContentPillars(prev => [...prev, val]);
    }
    setNewPillarInput("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await fetchApi(`/accounts/${account.id}/briefing`, {
        method: "PUT",
        body: JSON.stringify({
          brand_name: brandName.trim(),
          business_description: businessDescription.trim(),
          target_audience: targetAudience.trim(),
          tone_of_voice: toneOfVoice.trim(),
          content_pillars: contentPillars,
          dos_and_donts: dosAndDonts.trim(),
        }),
      });

      toast.success(`Briefing akun @${account.username} berhasil disimpan!`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("shiera-ai:accounts-updated"));
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan briefing akun.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-['Outfit'] text-white flex items-center gap-2">
                Briefing Akun @{account.username}
              </h2>
              <p className="text-[11px] text-purple-200/80">
                Fitur "Akun Itu Apa" — Mengenalkan karakteristik brand ke Shiera AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Brand Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>Nama Brand / Bisnis</span>
              <span className="text-[10px] font-normal text-slate-400">Wajib</span>
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Contoh: Skincare Beauty Co."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
            />
          </div>

          {/* Business Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Deskripsi Singkat Akun / Produk
            </label>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Contoh: Brand skincare lokal berbahan alami untuk mencerahkan kulit sensitif..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium resize-none"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Target Audiens (Siapa Pengikut / Pembelinya?)
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Contoh: Wanita 18-35 tahun, mahasiswa & pekerja muda yang ingin kulit glowing"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
            />
          </div>

          {/* Tone of Voice */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Tone of Voice (Gaya Bahasa AI)
            </label>
            <input
              type="text"
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              placeholder="Contoh: Friendly, Edukatif, Santai, Emosional, & Elegan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
            />
          </div>

          {/* Content Pillars Multi Selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block">
              Pilar Konten Utama Brand
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_PILLARS.map((pillar) => {
                const isSelected = contentPillars.includes(pillar);
                return (
                  <button
                    key={pillar}
                    type="button"
                    onClick={() => handleTogglePillar(pillar)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-purple-50"
                    }`}
                  >
                    {isSelected ? `✓ ${pillar}` : `+ ${pillar}`}
                  </button>
                );
              })}
              {contentPillars
                .filter((p) => !DEFAULT_PILLARS.includes(p))
                .map((pillar) => (
                  <button
                    key={pillar}
                    type="button"
                    onClick={() => handleTogglePillar(pillar)}
                    className="px-3 py-1.5 rounded-xl font-semibold bg-purple-600 text-white border border-purple-600 shadow-xs flex items-center gap-1"
                  >
                    <span>✓ {pillar}</span>
                  </button>
                ))}
            </div>

            {/* Custom Pillar Add */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPillarInput}
                onChange={(e) => setNewPillarInput(e.target.value)}
                placeholder="+ Tambah pilar konten khusus..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomPillar();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomPillar}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Tambah
              </button>
            </div>
          </div>

          {/* Do's and Don'ts */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Pantangan / Aturan Khusus (Do's & Don'ts)
            </label>
            <textarea
              value={dosAndDonts}
              onChange={(e) => setDosAndDonts(e.target.value)}
              placeholder="Contoh: Jangan pernah menyebut kata 'obat', selalu sertakan emoticon bintang, hindari klaim berlebihan..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium resize-none"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || !brandName.trim()}
              className="px-5 py-2.5 rounded-2xl gradient-brand text-white font-bold flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg transition-all disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : "Simpan Briefing"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
