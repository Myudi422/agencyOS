"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users2, Briefcase, Image as ImageIcon,
  CalendarDays, Cpu, History, Plus, ChevronDown, Sparkles, X,
  ShieldCheck, Wrench, Settings, LogOut, CreditCard,
  Zap, Rocket, Crown, Building2, UserCircle, Loader2, BarChart2
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { fetchApi } from "@/lib/api";
import { signOut } from "@/lib/auth";

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const TIER_ICONS: Record<string, any> = {
  trial: Zap,
  creator: Rocket,
  agency: Crown,
  studio: Building2,
};

const TIER_COLORS: Record<string, string> = {
  trial: "bg-slate-100 text-slate-600 border-slate-200",
  creator: "bg-blue-100 text-blue-700 border-blue-200",
  agency: "bg-purple-100 text-purple-700 border-purple-200",
  studio: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspaces, activeWorkspace, setWorkspaces, setActiveWorkspace, openComposer, openSettings } = useStore();
  const { user, subscription, isAdmin, logout } = useAuthStore();
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    // Workspace is primarily set during login via AuthProvider.
    // This effect refreshes workspace data if user navigates back (e.g. after creating a new workspace).
    // fetchApi automatically sends Authorization header.
    if (!activeWorkspace) {
      fetchApi<any[]>("/workspaces/")
        .then((data) => {
          if (data && data.length > 0) {
            setWorkspaces(data);
          }
        })
        .catch(() => {
          // Workspace already set from AuthProvider — ignore silently
        });
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    logout();
    router.replace("/login");
  };

  const handleOpenBillingPortal = () => {
    if (onCloseMobile) onCloseMobile();
    router.push("/pricing");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Proses", href: "/queue", icon: Cpu, activeDot: true },
    { name: "Statistik", href: "/statistics", icon: BarChart2 },
    { name: "Account Manager", href: "/accounts", icon: Users2, badge: "10 Platforms" },
    { name: "Client Roster", href: "/clients", icon: Briefcase },
    { name: "Media Library", href: "/media", icon: ImageIcon },
    { name: "Content Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Activity Log", href: "/activity", icon: History },
    { name: "Tools", href: "/yt-clipper", icon: Wrench, badge: "Local AI" },
    ...(isAdmin ? [{ name: "Admin Settings", href: "/admin", icon: Settings, isAdmin: true }] : []),
  ];

  // Quota display
  const usagePercent = subscription
    ? Math.min(100, Math.round((subscription.posts_used / subscription.posts_limit) * 100))
    : 0;
  const TierIcon = subscription ? (TIER_ICONS[subscription.plan_tier] || Zap) : Zap;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 border-r border-slate-200 bg-white flex flex-col justify-between select-none shadow-xs transition-transform duration-200 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-slate-100">
                <img src="/logo.png" alt="Shiera Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 font-['Outfit'] leading-none">
                  Shiera
                </h1>
                <p className="text-[9px] text-purple-600 font-semibold tracking-tight mt-0.5">
                  Kelola Sosmed Dalam Satu Tempat
                </p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 border-b border-slate-100 shrink-0">
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
          <div className="p-3 shrink-0">
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
          <nav className="px-3 space-y-0.5 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { if (onCloseMobile) onCloseMobile(); }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold shadow-sm"
                      : "text-slate-600 hover:text-purple-700 hover:bg-slate-50"
                  } ${(item as any).isAdmin ? "mt-2 border border-dashed border-slate-200" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-purple-600" : (item as any).isAdmin ? "text-slate-500" : "text-slate-400"}`} />
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

          {/* Profile & Billing Quick Actions */}
          <div className="px-3 pb-2 space-y-0.5 shrink-0">
            <p className="px-3 pt-2 pb-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Account
            </p>

            {/* Profile */}
            <button
              onClick={() => { openSettings(); if (onCloseMobile) onCloseMobile(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-purple-700 hover:bg-slate-50 transition-all text-left"
            >
              <UserCircle className="w-4 h-4 text-slate-400" />
              <span>Profile &amp; Settings</span>
            </button>

            {/* Billing */}
            {!isAdmin && subscription && (
              <button
                onClick={handleOpenBillingPortal}
                disabled={loadingPortal}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-purple-700 hover:bg-slate-50 transition-all text-left disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Billing &amp; Subscription</span>
                </div>
                {loadingPortal ? (
                  <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin shrink-0" />
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200/60 capitalize">
                    {subscription.plan_tier}
                  </span>
                )}
              </button>
            )}

            {/* Pricing (admin only) */}
            {isAdmin && (
              <Link
                href="/pricing"
                onClick={() => { if (onCloseMobile) onCloseMobile(); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname === "/pricing"
                    ? "bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold shadow-sm"
                    : "text-slate-600 hover:text-purple-700 hover:bg-slate-50"
                }`}
              >
                <CreditCard className={`w-4 h-4 ${pathname === "/pricing" ? "text-purple-600" : "text-slate-400"}`} />
                <span>Billing &amp; Pricing</span>
              </Link>
            )}
          </div>
        </div>

        {/* Footer — User Info + Quota */}
        <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/50">
          {/* Quota Bar (only for non-admin with subscription) */}
          {!isAdmin && subscription && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-medium">Post Quota</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {subscription.posts_used}/{subscription.posts_limit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usagePercent >= 90 && (
                <p className="text-[10px] text-red-500 font-medium mt-1">⚠️ Quota hampir habis!</p>
              )}
            </div>
          )}

          {/* Plan badge */}
          {subscription && (
            <div className="px-4 py-2">
              <button
                onClick={handleOpenBillingPortal}
                disabled={loadingPortal || isAdmin}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${TIER_COLORS[subscription.plan_tier]} hover:opacity-80 transition-opacity disabled:cursor-default`}
              >
                <TierIcon className="w-3 h-3" />
                {subscription.plan_name}
                {isAdmin && " (Admin)"}
              </button>
            </div>
          )}

          {/* User card */}
          <div className="p-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} className="w-7 h-7 rounded-full border border-slate-200 object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                    {user?.full_name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || "User"}</p>
                  <div className="flex items-center gap-1">
                    {isAdmin ? (
                      <ShieldCheck className="w-3 h-3 text-purple-600" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    <span className="text-[10px] text-slate-500 font-medium truncate">
                      {isAdmin ? "Admin" : user?.email?.split("@")[0] || "Shiera"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
