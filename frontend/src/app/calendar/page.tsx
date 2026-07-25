"use client";

import React, { useState, useEffect } from "react";
import { 
  CalendarDays, ChevronLeft, ChevronRight, Plus, 
  Instagram, Facebook, Clock, CheckCircle2, AlertTriangle, Sparkles 
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

export default function CalendarPage() {
  const { activeWorkspace, openComposer } = useStore();
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);

  const loadEvents = () => {
    if (!activeWorkspace?.id) return;
    fetchApi<any[]>(`/calendar/?workspace_id=${activeWorkspace.id}`)
      .then((data) => setEvents(data || []))
      .catch((err) => {
        setEvents([
          { id: "p1", title: "Luxury Apparel Collection Drop", status: "scheduled", scheduled_at: new Date(Date.now() + 86400000).toISOString(), post_type: "image" },
          { id: "p2", title: "Product Launch Teaser Reel", status: "published", scheduled_at: new Date(Date.now() - 43200000).toISOString(), post_type: "video" },
          { id: "p3", title: "Weekend Promo 20% Off", status: "scheduled", scheduled_at: new Date(Date.now() + 172800000).toISOString(), post_type: "carousel" }
        ]);
      });
  };

  useEffect(() => {
    loadEvents();
  }, [activeWorkspace?.id]);

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner - White Clean Glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200">
              Interactive Planner
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Content Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Visually schedule and monitor scheduled posts across all connected social channels.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  viewMode === v ? "bg-purple-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => openComposer()}
            className="py-3 px-5 rounded-2xl gradient-brand text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-6 rounded-3xl glass-card space-y-4">
        {/* Month Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-extrabold text-slate-900 font-['Outfit'] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-600" />
            <span>July 2026</span>
          </h2>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase py-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dayEvents = events.filter((e) => {
              const dt = new Date(e.scheduled_at);
              return dt.getDate() === day;
            });

            return (
              <div
                key={day}
                className="min-h-[110px] p-2.5 rounded-2xl bg-white/90 border border-slate-200/80 flex flex-col justify-between hover:border-purple-300 transition-all shadow-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${day === 25 ? "text-purple-600 font-black" : "text-slate-600"}`}>
                    {day}
                  </span>
                  <button
                    onClick={() => openComposer()}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-purple-600 transition-opacity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Day events badges */}
                <div className="space-y-1 mt-1">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-1.5 rounded-xl text-[10px] font-bold border truncate flex items-center justify-between ${
                        ev.status === "published"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-purple-50 border-purple-200 text-purple-700"
                      }`}
                    >
                      <span className="truncate">{ev.title}</span>
                      <Instagram className="w-2.5 h-2.5 shrink-0 ml-1 opacity-70" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
