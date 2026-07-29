"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  CalendarDays, ChevronLeft, ChevronRight, Plus, 
  Clock, CheckCircle2, Loader2, RefreshCw, X, Filter, Globe, Edit3, Image as ImageIcon
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸", facebook: "📘", x: "𝕏", tiktok: "🎵",
  youtube: "▶️", linkedin: "💼", pinterest: "📌",
  bluesky: "🦋", threads: "🧵"
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", x: "X (Twitter)", tiktok: "TikTok",
  youtube: "YouTube", linkedin: "LinkedIn", pinterest: "Pinterest",
  bluesky: "Bluesky", threads: "Threads"
};

export default function CalendarPage() {
  const { activeWorkspace, openComposer } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState("");

  // Modal for Day Detail when there are many posts
  const [selectedDayModal, setSelectedDayModal] = useState<{
    day: number;
    date: Date;
    events: any[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadEvents = useCallback(() => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    fetchApi<any[]>(`/calendar/?workspace_id=${activeWorkspace.id}`)
      .then((data) => setEvents(data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Month navigation helpers
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString("id-ID", { month: "long", year: "numeric" });

  // Grid calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const today = new Date();
  const isToday = (day: number) => 
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  // Filter events by selected platform
  const filteredEvents = events.filter(ev => {
    if (!filterPlatform) return true;
    const targetPlatforms = ev.targets?.map((t: any) => t.platform) || ev.platforms || [];
    return targetPlatforms.includes(filterPlatform);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200">
              PostForMe Live Planner
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center gap-1 border border-slate-200">
              <Globe className="w-3 h-3 text-purple-500" />
              WIB (GMT+7)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Content Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Pantau dan kelola jadwal postingan sosmed kamu secara visual & terintegrasi penuh dengan PostForMe API.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Platform Filter Dropdown */}
          <div className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <select
              value={filterPlatform}
              onChange={e => setFilterPlatform(e.target.value)}
              className="bg-transparent outline-none cursor-pointer pr-1"
            >
              <option value="">Semua Platform</option>
              {Object.entries(PLATFORM_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {PLATFORM_ICONS[k]} {label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadEvents()}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-all shrink-0"
            title="Refresh Kalender"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>

          <button
            onClick={() => openComposer()}
            className="py-3 px-5 rounded-2xl gradient-brand text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Post Baru</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card space-y-4 overflow-hidden">
        {/* Month Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-extrabold text-slate-900 font-['Outfit'] flex items-center gap-2 capitalize">
            <CalendarDays className="w-5 h-5 text-purple-600" />
            <span>{monthName}</span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={todayMonth}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase py-2">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, idx) => (
            <div key={d} className="truncate">
              <span className="hidden sm:inline">
                {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][idx]}
              </span>
              <span className="sm:hidden">{d}</span>
            </div>
          ))}
        </div>

        {/* Month Days Grid (Responsive Horizontal Scroll on small mobile if needed) */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 min-w-[640px] md:min-w-0">
            {/* Padding days */}
            {paddingDays.map((p) => (
              <div key={`pad-${p}`} className="min-h-[105px] sm:min-h-[120px] p-2 rounded-2xl bg-slate-50/40 border border-slate-100 opacity-40 pointer-events-none" />
            ))}

            {/* Month Days */}
            {monthDays.map((day) => {
              const dayEvents = filteredEvents.filter((e) => {
                if (!e.scheduled_at) return false;
                const dt = new Date(e.scheduled_at);
                return dt.getDate() === day && dt.getMonth() === month && dt.getFullYear() === year;
              });

              // Show max 2 events directly inside the day cell
              const visibleEvents = dayEvents.slice(0, 2);
              const extraCount = dayEvents.length - visibleEvents.length;

              return (
                <div
                  key={day}
                  className={`min-h-[105px] sm:min-h-[120px] p-2 sm:p-2.5 rounded-2xl border flex flex-col justify-between transition-all shadow-xs group ${
                    isToday(day)
                      ? "bg-purple-50/60 border-purple-300 ring-2 ring-purple-200"
                      : "bg-white/90 border-slate-200/80 hover:border-purple-300"
                  }`}
                >
                  {/* Day cell header */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${isToday(day) ? "text-purple-700 font-black" : "text-slate-700"}`}>
                      {day}
                    </span>
                    <button
                      onClick={() => {
                        const selectedDate = new Date(year, month, day, 10, 0);
                        openComposer([], { scheduled_at: selectedDate.toISOString() });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-purple-600 transition-opacity"
                      title="Jadwalkan di tanggal ini"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day events badges list */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {visibleEvents.map((ev) => {
                      const isProcessed = ev.status === "processed" || ev.status === "published";
                      const isProcessing = ev.status === "processing";
                      const isDraft = ev.status === "draft";
                      const icon = ev.targets?.[0]?.platform ? PLATFORM_ICONS[ev.targets[0].platform] : "📝";
                      const thumbUrl = ev.media_urls?.[0];

                      return (
                        <div
                          key={ev.id}
                          onClick={() => openComposer(ev.account_ids || [], ev)}
                          className={`p-1 rounded-xl text-[10px] font-bold border truncate flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                            isProcessed
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : isProcessing
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : isDraft
                              ? "bg-slate-100 border-slate-200 text-slate-700"
                              : "bg-purple-50 border-purple-200 text-purple-700"
                          }`}
                          title={`${ev.caption || ev.title} (${ev.status})`}
                        >
                          {/* Mini Thumbnail */}
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt="thumb"
                              className="w-4 h-4 rounded-md object-cover shrink-0 mr-1 border border-black/10"
                            />
                          ) : null}

                          <span className="truncate flex-1 font-semibold">{ev.caption || ev.title}</span>
                          <span className="shrink-0 ml-1 opacity-80">{icon}</span>
                        </div>
                      );
                    })}

                    {/* Button "+N post lagi" when there are many posts on this day */}
                    {extraCount > 0 && (
                      <button
                        onClick={() => setSelectedDayModal({ day, date: new Date(year, month, day), events: dayEvents })}
                        className="w-full text-center py-0.5 rounded-lg text-[9px] font-bold text-purple-700 bg-purple-100/70 hover:bg-purple-200 transition-colors"
                      >
                        +{extraCount} post lagi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Day Detail Modal (When day has many posts) ─── */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Detail Jadwal Hari Ini</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedDayModal.date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of all posts on this day */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDayModal.events.map((ev) => {
                const icon = ev.targets?.[0]?.platform ? PLATFORM_ICONS[ev.targets[0].platform] : "📝";
                const timeStr = ev.scheduled_at
                  ? new Date(ev.scheduled_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                  : "-";

                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-purple-300 transition-all flex items-start gap-3"
                  >
                    {/* Media Thumbnail */}
                    {ev.media_urls?.[0] ? (
                      <img
                        src={ev.media_urls[0]}
                        alt="media"
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                          ⏰ {timeStr}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {icon} {ev.targets?.[0]?.platform || "Social"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                        {ev.caption || ev.title}
                      </p>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setSelectedDayModal(null);
                        openComposer(ev.account_ids || [], ev);
                      }}
                      className="p-2 rounded-xl text-purple-600 hover:bg-purple-100 transition-colors shrink-0"
                      title="Edit di Composer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const selDate = selectedDayModal.date;
                  setSelectedDayModal(null);
                  openComposer([], { scheduled_at: selDate.toISOString() });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Post di Tanggal Ini
              </button>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
