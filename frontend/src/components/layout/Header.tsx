"use client";

import React, { useEffect, useState } from "react";
import { Search, Briefcase, Plus, Sparkles, Menu, X, ShieldCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

export default function Header({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const { activeWorkspace, clients, activeClientId, setClients, setActiveClientId, openComposer } = useStore();

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    fetchApi<any[]>(`/clients/?workspace_id=${activeWorkspace.id}`)
      .then((data) => setClients(data))
      .catch((err) => console.log("Default clients loaded", err));
  }, [activeWorkspace?.id, setClients]);

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      {/* Left section: Mobile Menu Toggle & Active Client Switcher */}
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 transition-all"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Client Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-inner">
          <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span className="hidden sm:inline text-xs text-slate-500 font-medium">Client:</span>
          <select
            value={activeClientId || "all"}
            onChange={(e) => setActiveClientId(e.target.value === "all" ? null : e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="all" className="bg-white text-slate-800">
              All Clients ({clients.length})
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-white text-slate-800">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* AgencyOS Engine Badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200/70 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
          </span>
          <span className="text-[11px] font-semibold">AgencyOS AI Engine Active</span>
        </div>
      </div>

      {/* Right section: Search & Action Button */}
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channels, posts..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder-slate-400 focus:outline-none"
          />
        </div>

        <button
          onClick={() => openComposer()}
          className="py-2 px-4 rounded-xl gradient-brand text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Post</span>
          <span className="sm:hidden">Post</span>
        </button>
      </div>
    </header>
  );
}
