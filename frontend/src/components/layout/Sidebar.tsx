"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users2, Briefcase, Image as ImageIcon, 
  CalendarDays, Cpu, History, Plus, ChevronDown, Sparkles, Instagram, Facebook 
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const { workspaces, activeWorkspace, setWorkspaces, setActiveWorkspace, openComposer } = useStore();

  useEffect(() => {
    fetchApi<any[]>("/workspaces/")
      .then((data) => {
        if (data && data.length > 0) {
          setWorkspaces(data);
        }
      })
      .catch((err) => {
        console.log("Using default workspace state", err);
        setWorkspaces([
          { id: "ws-default", name: "Apex Global Agency HQ", slug: "agency-hq", timezone: "Asia/Jakarta" }
        ]);
      });
  }, [setWorkspaces]);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Account Manager", href: "/accounts", icon: Users2, badge: "500+" },
    { name: "Client Roster", href: "/clients", icon: Briefcase },
    { name: "Media Library", href: "/media", icon: ImageIcon },
    { name: "Content Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Queue Engine", href: "/queue", icon: Cpu, activeDot: true },
    { name: "Activity Log", href: "/activity", icon: History },
  ];

  return (
    <aside className="w-64 border-r border-border bg-[#0b0c13] flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand & Workspace Switcher Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight gradient-text font-['Outfit']">AgencyOS</h1>
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Enterprise MVP</span>
              </div>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="relative">
            <button className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#141622] hover:bg-[#1c1f30] border border-border text-left transition-all">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-6 h-6 rounded bg-indigo-600/30 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/40">
                  {activeWorkspace?.name.charAt(0) || "A"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-gray-200 truncate">{activeWorkspace?.name || "Apex Global Agency"}</p>
                  <p className="text-[10px] text-gray-400">{activeWorkspace?.timezone || "UTC"}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4">
          <button
            onClick={() => openComposer()}
            className="w-full py-2.5 px-4 rounded-xl gradient-brand text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Post</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#141622]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-gray-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
                {item.activeDot && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Platforms Footer */}
      <div className="p-3 border-t border-border bg-[#08090e]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow">
              AR
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-200">Alex Rivera</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-gray-400">Meta OAuth Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center">
              <Instagram className="w-3 h-3 text-white" />
            </div>
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <Facebook className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
