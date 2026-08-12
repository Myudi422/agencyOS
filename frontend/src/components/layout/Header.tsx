"use client";

import React, { useEffect, useState } from "react";
import { Search, Briefcase, Plus, Sparkles, Menu, X, ShieldCheck, Zap, Rocket, Crown, Building2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { fetchApi } from "@/lib/api";

const TIER_COLORS: Record<string, string> = {
  trial: "bg-slate-100 text-slate-600 border-slate-200",
  creator: "bg-blue-100 text-blue-700 border-blue-200",
  agency: "bg-purple-100 text-purple-700 border-purple-200",
  studio: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function Header({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const { activeWorkspace, clients, activeClientId, setClients, setActiveClientId, openComposer, openSettings } = useStore();
  const { user, subscription, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    fetchApi<any[]>(`/clients/?workspace_id=${activeWorkspace.id}`)
      .then((data) => setClients(data))
      .catch((err) => console.log("Default clients loaded", err));
  }, [activeWorkspace?.id, setClients]);

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left section: Mobile Menu Toggle & Active Client Switcher */}
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={onToggleMobileSidebar}
          data-tour="mobile-hamburger"
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
      </div>

      {/* Right section: Active Plan, User Avatar & Create Post */}
      <div className="flex items-center gap-4">
        {/* Subscription Plan Badge */}
        {subscription && (
          <div className="hidden sm:flex">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${TIER_COLORS[subscription.plan_tier]}`}>
              {subscription.plan_name}
              {isAdmin && " (Admin)"}
            </span>
          </div>
        )}

        {/* User Profile Mini Card (Clickable to open Settings Modal) */}
        <button
          onClick={openSettings}
          className="flex items-center gap-2 border-l border-slate-200 pl-4 hover:opacity-80 transition-opacity focus:outline-none"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} className="w-7 h-7 rounded-full border border-slate-200 object-cover shrink-0" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {user?.full_name?.charAt(0) || "U"}
            </div>
          )}
          <span className="hidden lg:inline text-xs font-semibold text-slate-700 text-left truncate max-w-[120px]">
            {user?.full_name || "User"}
          </span>
        </button>
      </div>
    </header>
  );
}

