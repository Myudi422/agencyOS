"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users2, Briefcase, Image as ImageIcon, 
  CalendarDays, Cpu, History, Plus, ChevronDown, Sparkles, X, ShieldCheck 
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
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
    { name: "Account Manager", href: "/accounts", icon: Users2, badge: "10 Platforms" },
    { name: "Client Roster", href: "/clients", icon: Briefcase },
    { name: "Media Library", href: "/media", icon: ImageIcon },
    { name: "Content Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Queue Engine", href: "/queue", icon: Cpu, activeDot: true },
    { name: "Activity Log", href: "/activity", icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 border-r border-slate-200/80 bg-white/90 backdrop-blur-xl flex flex-col justify-between select-none shadow-sm transition-transform duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-purple-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 font-['Outfit'] flex items-center gap-1.5">
                  AgencyOS <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold border border-purple-200">AI</span>
                </h1>
                <span className="text-[10px] text-slate-500 font-medium">White Glass Edition</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={onCloseMobile} 
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 border-b border-slate-100">
            <button className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 text-left transition-all">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {activeWorkspace?.name.charAt(0) || "A"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 truncate">{activeWorkspace?.name || "Apex Global Agency"}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{activeWorkspace?.timezone || "UTC"}</p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Create Post CTA */}
          <div className="p-3">
            <button
              onClick={() => {
                openComposer();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2.5 px-4 rounded-xl gradient-brand text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all"
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
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold shadow-sm"
                      : "text-slate-600 hover:text-purple-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-purple-600" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200/60">
                      {item.badge}
                    </span>
                  )}
                  {item.activeDot && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Account Status */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                AG
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Apex Agency</p>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                  <span className="text-[10px] text-slate-500 font-medium">AgencyOS AI Core</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
