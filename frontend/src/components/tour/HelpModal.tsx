"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { startAppTour } from "./AppTour";
import { Sparkles, LayoutDashboard, PlusCircle, BarChart2, History, X, ChevronRight, HelpCircle, BookOpen, Users2, CalendarDays, Bot, Briefcase } from "lucide-react";

export function openHelpCenter() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("agencyos-open-help-modal"));
  }
}

export default function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { openComposer } = useStore();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("agencyos-open-help-modal", handleOpen);
    return () => window.removeEventListener("agencyos-open-help-modal", handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleSelectOption = (action: () => void) => {
    setIsOpen(false);
    // Slight delay to allow modal close animation
    setTimeout(() => {
      action();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-white border border-purple-100 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-['Outfit']">
                Pusat Bantuan &amp; Panduan App
              </h3>
              <p className="text-xs text-slate-500">Pilih topik tutorial untuk dipandu secara interaktif</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Option 1: Dashboard & System Overview */}
          <button
            onClick={() => handleSelectOption(() => {
              router.push("/dashboard");
              setTimeout(() => startAppTour("default"), 300);
            })}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                  1. Tour Navigasi Dashboard &amp; Overview Sistem
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Pengenalan menu utama, widget statistik, dan asisten Shiera AI.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Option 2: Post Composer Guide */}
          <button
            onClick={() => handleSelectOption(() => {
              openComposer();
              setTimeout(() => startAppTour("composer"), 400);
            })}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                  2. Panduan Membuat &amp; Menjadwalkan Post
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Panduan memilih akun multi-channel, AI Auto-Caption, media, &amp; jadwal.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Option 3: Queue & Publishing Engine Guide */}
          <button
            onClick={() => handleSelectOption(() => {
              router.push("/queue");
              setTimeout(() => startAppTour("queue"), 400);
            })}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                  3. Panduan Queue &amp; Manajemen Status Postingan
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Kelola Draf, Antrean Terjadwal WIB/UTC, Diproses, &amp; Sync Hasil Publikasi.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Option 4: Accounts Manager Guide */}
          <button
            onClick={() => handleSelectOption(() => {
              router.push("/accounts");
              setTimeout(() => startAppTour("accounts"), 400);
            })}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold">
                <Users2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                  4. Panduan Menghubungkan &amp; Manajemen Akun Social
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Otentikasi platform sosial media, Briefing Tone, &amp; Auto-Watermark.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Option 5: Content Calendar Guide */}
          <button
            onClick={() => handleSelectOption(() => {
              router.push("/calendar");
              setTimeout(() => startAppTour("calendar"), 400);
            })}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                  5. Panduan Kalender Konten &amp; Jadwal Tayang Visual
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Visualisasi jadwal postingan bulanan WIB/UTC &amp; filter per platform.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Option 6: AI Agent Guide */}
          <button
            onClick={() => handleSelectOption(() => {
              router.push("/agent");
              setTimeout(() => startAppTour("agent"), 400);
            })}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                  6. Panduan Shiera AI Agent Otomatis
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Otomasi pembuatan brief &amp; draf harian, penjadwalan run, &amp; transfer composer.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Option 7: Statistics & Analytics Guide */}
          <button
            onClick={() => handleSelectOption(() => {
              router.push("/statistics");
              setTimeout(() => startAppTour("statistics"), 400);
            })}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                  7. Panduan Analitik Performa &amp; Export PDF
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Monitor metric engagement, impresi, reach, serta export laporan PDF executive.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Option 8: Clients Roster Guide */}
          <button
            onClick={() => handleSelectOption(() => {
              router.push("/clients");
              setTimeout(() => startAppTour("clients"), 400);
            })}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                  8. Panduan Manajemen Profil Klien Agensi
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Kelola roster klien, aksen warna brand, timezone, dan keterikatan saluran sosial.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>

        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Anda dapat membuka pusat bantuan ini kapan saja dari tombol <strong className="text-slate-600 font-semibold">Help (Panduan App)</strong> di Sidebar.
          </p>
        </div>
      </div>
    </div>
  );
}
