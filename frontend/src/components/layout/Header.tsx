"use client";

import React, { useEffect } from "react";
import { Search, Briefcase, Plus, RefreshCw, Layers, Instagram, Facebook } from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

export default function Header() {
  const { activeWorkspace, clients, activeClientId, setClients, setActiveClientId } = useStore();

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    fetchApi<any[]>(`/clients/?workspace_id=${activeWorkspace.id}`)
      .then((data) => setClients(data))
      .catch((err) => console.log("Default clients loaded", err));
  }, [activeWorkspace?.id, setClients]);

  const handleMetaConnect = async () => {
    try {
      const res = await fetchApi<{ url: string }>("/auth/meta/connect", { method: "POST" });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (e: any) {
      alert(`Meta OAuth Connect Error: ${e.message || e}`);
    }
  };

  const handleInstagramConnect = async () => {
    try {
      const res = await fetchApi<{ url: string }>("/auth/instagram/connect", { method: "POST" });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (e: any) {
      alert(`Instagram Direct Connect Error: ${e.message || e}`);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-[#090a0f]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
      {/* Left section: Client Filter Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#12141d] border border-border px-3 py-1.5 rounded-lg">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-gray-400 font-medium">Active Client:</span>
          <select
            value={activeClientId || "all"}
            onChange={(e) => setActiveClientId(e.target.value === "all" ? null : e.target.value)}
            className="bg-transparent text-xs font-semibold text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#12141d] text-gray-200">
              All Clients ({clients.length})
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#12141d] text-gray-200">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-[#12141d]/50 px-2.5 py-1.5 rounded-md border border-border/50">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>PostgreSQL + Upstash Redis</span>
        </div>
      </div>

      {/* Right section: Search & Login Actions */}
      <div className="flex items-center gap-2.5">
        <div className="relative hidden lg:block w-56">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search accounts, posts, media..."
            className="w-full bg-[#12141d] border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          onClick={handleMetaConnect}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all"
          title="Connect via Facebook Page + Instagram Business"
        >
          <Facebook className="w-3.5 h-3.5" />
          <span>Meta OAuth</span>
        </button>

        <button
          onClick={handleInstagramConnect}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-medium text-xs shadow-md shadow-pink-500/20 transition-all"
          title="Connect via Direct Instagram Login"
        >
          <Instagram className="w-3.5 h-3.5" />
          <span>Instagram Direct</span>
        </button>
      </div>
    </header>
  );
}
