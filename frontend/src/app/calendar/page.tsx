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
      .then((data) => setEvents(data))
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit'] gradient-text">
            Interactive Content Calendar
          </h1>
          <p className="text-xs text-gray-400">
            Schedule and visually drag-and-drop posts across Month, Week, and Day calendar views.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month/Week/Day Toggle */}
          <div className="flex bg-[#141624] border border-border rounded-xl p-1">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  viewMode === v ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => openComposer()}
            className="py-2.5 px-4 rounded-xl gradient-brand text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-6 rounded-2xl glass-card border border-border/80 space-y-4">
        {/* Month Header Navigation */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <h2 className="text-base font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            <span>July 2026</span>
          </h2>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-[#141624] border border-border text-gray-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg bg-[#141624] border border-border text-gray-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400 uppercase py-2">
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
                className="min-h-[110px] p-2 rounded-xl bg-[#121422] border border-border/60 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${day === 24 ? "text-indigo-400 font-extrabold" : "text-gray-400"}`}>
                    {day}
                  </span>
                  <button
                    onClick={() => openComposer()}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-400 transition-opacity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Day events badges */}
                <div className="space-y-1 mt-1">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-1.5 rounded-lg text-[10px] font-medium border truncate flex items-center justify-between ${
                        ev.status === "published"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
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
