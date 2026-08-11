"use client";

import React, { useState, useEffect } from "react";
import { X, Bot, Sparkles, ChevronRight, ChevronLeft, Check, Clock, Calendar, Users2, Zap, Layers, Video, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { AgentConfig } from "@/store/useAgentStore";

const CONTENT_PILLARS = [
  { id: "Edukasi & Tips", name: "📚 Edukasi & Tips", desc: "Tutorial, info bermanfaat, & hacks" },
  { id: "Promosi & Penjualan", name: "📢 Promosi & Soft-Sell", desc: "Promo gajian, diskon, & penawaran" },
  { id: "Meme & Entertainment", name: "😂 Meme & Hiburan", desc: "Relatable humor & konten viral" },
  { id: "Storytelling & Brand", name: "📖 Storytelling Brand", desc: "Kisah inspirasi & behind the scene" },
  { id: "Behind The Scene", name: "🎬 Behind The Scene", desc: "Proses pembuatan & tim di balik layar" },
  { id: "Testimoni & Review", name: "🌟 Testimoni & Proof", desc: "Ulasan pembeli & social proof" },
];

const CONTENT_FORMATS = [
  { id: "single_image", name: "🖼️ Single Image", desc: "1 Gambar / Feed Post biasa", Icon: ImageIcon },
  { id: "carousel", name: "🎠 Carousel", desc: "Mikro-blogging / slide beruntun", Icon: Layers },
  { id: "video", name: "🎬 Video / Reels", desc: "Video pendek + script detik demi detik", Icon: Video },
  { id: "auto", name: "💡 Rekomendasi AI", desc: "Biarkan Shiera AI memilih format terbaik", Icon: Sparkles },
];

const WEEKDAYS = [
  { id: 0, short: "Sen", full: "Senin" },
  { id: 1, short: "Sel", full: "Selasa" },
  { id: 2, short: "Rab", full: "Rabu" },
  { id: 3, short: "Kam", full: "Kamis" },
  { id: 4, short: "Jum", full: "Jumat" },
  { id: 5, short: "Sab", full: "Sabtu" },
  { id: 6, short: "Min", full: "Minggu" },
];

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸", facebook: "📘", x: "𝕏", tiktok: "🎵",
  youtube: "▶️", linkedin: "💼", pinterest: "📌",
  bluesky: "🦋", threads: "🧵", tiktok_business: "🎵",
};

interface SocialAccountMeta {
  id: string; platform: string; name: string; username: string; avatar_url?: string; briefing?: any;
}

interface Props {
  onClose: () => void;
  onSave: (agent: AgentConfig) => void;
  editAgent?: AgentConfig | null;
}

export default function AgentCreateModal({ onClose, onSave, editAgent }: Props) {
  const { activeWorkspace } = useStore();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccountMeta[]>([]);

  // Form state
  const [name, setName] = useState(editAgent?.name || "");
  const [description, setDescription] = useState(editAgent?.description || "");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(editAgent?.account_ids || []);
  const [pillar, setPillar] = useState(editAgent?.content_pillar || "");
  const [format, setFormat] = useState(editAgent?.content_format || "");
  const [topicHint, setTopicHint] = useState(editAgent?.topic_hint || "");
  const [draftsPerRun, setDraftsPerRun] = useState<number>(editAgent?.drafts_per_run || 1);
  const [runTime, setRunTime] = useState(editAgent?.run_time || "08:00");
  const [timezone, setTimezone] = useState(editAgent?.timezone || "Asia/Jakarta");
  const [runDays, setRunDays] = useState<number[]>(editAgent?.run_days || [0, 1, 2, 3, 4]);

  const TOTAL_STEPS = 4;

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    fetchApi<any>(`/accounts/?workspace_id=${activeWorkspace.id}&limit=100`)
      .then((res: any) => {
        const accs = res.items || (Array.isArray(res) ? res : []);
        setAccounts(accs);
      })
      .catch(() => setAccounts([]));
  }, [activeWorkspace?.id]);

  const toggleDay = (day: number) => {
    setRunDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const canNext = () => {
    if (step === 1) return name.trim().length > 0 && selectedAccounts.length > 0;
    if (step === 2) return !!pillar;
    if (step === 3) return !!format;
    return runDays.length > 0;
  };

  const handleSave = async () => {
    if (!activeWorkspace?.id) return;
    setSaving(true);
    try {
      const payload = {
        workspace_id: activeWorkspace.id,
        name, description,
        account_ids: selectedAccounts,
        content_pillar: pillar,
        content_format: format,
        topic_hint: topicHint || undefined,
        drafts_per_run: draftsPerRun,
        run_time: runTime,
        timezone,
        run_days: runDays,
        is_active: true,
      };

      let result: AgentConfig;
      if (editAgent) {
        result = await fetchApi<AgentConfig>(`/agents/${editAgent.id}`, {
          method: "PATCH", body: JSON.stringify(payload),
        });
        toast.success("Agent berhasil diperbarui!");
      } else {
        result = await fetchApi<AgentConfig>("/agents/", {
          method: "POST", body: JSON.stringify(payload),
        });
        toast.success("Agent berhasil dibuat & dijadwalkan! 🤖");
      }
      onSave(result);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan agent.");
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ["Info & Akun", "Pilar Konten", "Format", "Jadwal"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-['Outfit']">{editAgent ? "Edit Agent" : "Buat AI Agent Baru"}</h2>
              <p className="text-[10px] text-purple-200/70">Langkah {step} dari {TOTAL_STEPS} — {stepLabels[step - 1]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex px-6 pt-4 pb-2 gap-1.5 shrink-0">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div className={`h-1.5 rounded-full transition-all ${i + 1 <= step ? "bg-purple-600" : "bg-slate-200"}`} />
              <span className={`text-[9px] font-semibold text-center ${i + 1 === step ? "text-purple-700" : "text-slate-400"}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-3">

          {/* Step 1: Name + Accounts */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Agent</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Contoh: "Daily Promo Brief", "Edukasi Harian"'
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 font-medium"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi (Opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat tentang agent ini..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 font-medium resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Akun Target <span className="text-purple-600">({selectedAccounts.length} dipilih)</span>
                </label>
                {accounts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada akun terhubung.</p>
                ) : (
                  <>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {accounts.map((acc) => {
                        const selected = selectedAccounts.includes(acc.id);
                        const hasBriefing = acc.briefing && Object.keys(acc.briefing).some(k => k !== 'updated_at' && Boolean(acc.briefing[k]));
                        return (
                          <button
                            key={acc.id}
                            onClick={() => toggleAccount(acc.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selected ? "border-purple-300 bg-purple-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                          >
                            <span className="text-lg leading-none">{PLATFORM_ICONS[acc.platform] || "🌐"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-slate-800 truncate">{acc.name}</p>
                                {hasBriefing ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 font-bold shrink-0">
                                    Briefing Ready
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-700 font-bold shrink-0">
                                    ⚠️ Belum Ada Briefing
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500">@{acc.username} · {acc.platform}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "bg-purple-600 border-purple-600" : "border-slate-300"}`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Warning if selected accounts have no briefing */}
                    {selectedAccounts.some(id => {
                      const acc = accounts.find(a => a.id === id);
                      return acc && (!acc.briefing || !Object.keys(acc.briefing).some(k => k !== 'updated_at' && Boolean(acc.briefing[k])));
                    }) && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-[11px]">Peringatan Briefing Akun</p>
                          <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                            Beberapa akun terpilih belum memiliki data <strong>Briefing Akun</strong>. AI Agent membutuhkan Briefing Akun untuk memahami persona &amp; produk brand Anda. Silakan lengkapi Briefing di menu <a href="/accounts" className="underline font-bold" target="_blank" rel="noreferrer">/accounts</a> agar Agent dapat berjalan.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Content Pillar */}
          {step === 2 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">Pilih pilar konten yang akan difokuskan AI agent ini setiap harinya.</p>
              {CONTENT_PILLARS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPillar(p.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${pillar === p.id ? "border-purple-300 bg-purple-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <span className="text-xl leading-none">{p.name.split(" ")[0]}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{p.name.substring(p.name.indexOf(" ") + 1)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                  </div>
                  {pillar === p.id && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Format + Topic Hint */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-2">Format konten yang akan dihasilkan AI.</p>
                {CONTENT_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${format === f.id ? "border-purple-300 bg-purple-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <span className="text-xl leading-none">{f.name.split(" ")[0]}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{f.name.substring(f.name.indexOf(" ") + 1)}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
                    </div>
                    {format === f.id && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Jumlah Draft Dihasilkan per Run
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDraftsPerRun(num)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        draftsPerRun === num
                          ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {num} Draft (Maks 2)
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">Berapa variasi pilihan draft yang akan dibuatkan AI setiap kali jalan.</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Seed Topik / Hint <span className="text-slate-400 normal-case font-normal">(opsional)</span>
                </label>
                <textarea
                  value={topicHint}
                  onChange={(e) => setTopicHint(e.target.value)}
                  placeholder='Contoh: "promo akhir bulan", "tips skincare kulit kering", "behind the scene tim kita"...'
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 font-medium resize-none"
                />
                <p className="text-[10px] text-slate-400">Jika dikosongkan, AI akan bebas membuat topik relevan berdasarkan briefing akun.</p>
              </div>
            </div>
          )}

          {/* Step 4: Schedule */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Waktu Jalankan (HH:MM)
                </label>
                <input
                  type="time"
                  value={runTime}
                  onChange={(e) => setRunTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 font-medium"
                >
                  <option value="Asia/Jakarta">WIB — Asia/Jakarta (UTC+7)</option>
                  <option value="Asia/Makassar">WITA — Asia/Makassar (UTC+8)</option>
                  <option value="Asia/Jayapura">WIT — Asia/Jayapura (UTC+9)</option>
                  <option value="UTC">UTC</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Hari Aktif
                </label>
                <div className="flex gap-2 flex-wrap">
                  {WEEKDAYS.map((day) => {
                    const active = runDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${active ? "bg-purple-600 border-purple-600 text-white" : "border-slate-200 text-slate-500 hover:border-purple-300 hover:text-purple-600"}`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setRunDays([0,1,2,3,4])} className="text-[10px] text-purple-600 hover:underline font-semibold">Hari Kerja</button>
                  <span className="text-slate-300">·</span>
                  <button onClick={() => setRunDays([0,1,2,3,4,5,6])} className="text-[10px] text-purple-600 hover:underline font-semibold">Setiap Hari</button>
                  <span className="text-slate-300">·</span>
                  <button onClick={() => setRunDays([])} className="text-[10px] text-slate-500 hover:underline font-semibold">Reset</button>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 space-y-1.5">
                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Ringkasan Agent</p>
                <p className="text-xs text-slate-700"><span className="font-semibold">Nama:</span> {name}</p>
                <p className="text-xs text-slate-700"><span className="font-semibold">Akun:</span> {selectedAccounts.length} akun dipilih</p>
                <p className="text-xs text-slate-700"><span className="font-semibold">Pilar:</span> {pillar}</p>
                <p className="text-xs text-slate-700"><span className="font-semibold">Format:</span> {format}</p>
                <p className="text-xs text-slate-700"><span className="font-semibold">Jadwal:</span> Setiap {runDays.map(d => WEEKDAYS[d]?.short).join(", ")} pukul {runTime} ({timezone.split("/").pop()})</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {step === 1 ? "Batal" : "Kembali"}
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lanjut
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !canNext()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-40"
            >
              {saving ? (
                <><span className="animate-spin">⏳</span> Menyimpan...</>
              ) : (
                <><Bot className="w-3.5 h-3.5" />{editAgent ? "Simpan Perubahan" : "Aktifkan Agent"}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
