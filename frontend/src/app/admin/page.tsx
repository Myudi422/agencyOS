"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Settings, Users, CreditCard, Key, RefreshCw,
  Save, Edit2, ChevronRight, Shield, Trash2, Plus,
  CheckCircle, AlertTriangle, Zap, Crown, Rocket, Building2,
  Sparkles, Bot, CheckCircle2, XCircle, Search, Filter, Clock,
  Calendar, ChevronLeft, X, UserCheck, UserX, SlidersHorizontal, Check,
  Eye, EyeOff, Copy, Lock, Server, MessageSquare, Globe, UserPlus, HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { fetchApi } from "@/lib/api";

type TabType = "plans" | "users" | "settings";

const TIER_ICONS: Record<string, any> = {
  trial: Zap,
  creator: Rocket,
  agency: Crown,
  studio: Building2,
};

const TIER_COLORS: Record<string, string> = {
  trial: "text-slate-600 bg-slate-100",
  creator: "text-blue-600 bg-blue-100",
  agency: "text-purple-600 bg-purple-100",
  studio: "text-amber-600 bg-amber-100",
};

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("plans");

  // Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planEdits, setPlanEdits] = useState<any>({});
  const [planSaving, setPlanSaving] = useState(false);

  // Users state with pagination, search & filters
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userStats, setUserStats] = useState<{ total_users: number; total_admins: number; active_subs: number; expired_subs: number } | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(20);
  const [usersSearch, setUsersSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [usersTier, setUsersTier] = useState("");
  const [usersStatus, setUsersStatus] = useState("");
  const [usersIsAdminFilter, setUsersIsAdminFilter] = useState<string>(""); // "", "true", "false"
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Edit User Subscription Modal state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editTier, setEditTier] = useState("creator");
  const [editStatus, setEditStatus] = useState("active");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editPostsLimit, setEditPostsLimit] = useState<number | "">("");
  const [editPostsUsed, setEditPostsUsed] = useState<number | "">("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [userSaving, setUserSaving] = useState(false);

  // Assign plan & admin role state
  const [assignEmail, setAssignEmail] = useState("");
  const [assignTier, setAssignTier] = useState("agency");
  const [assignDays, setAssignDays] = useState(30);
  const [assignIsAdmin, setAssignIsAdmin] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignResult, setAssignResult] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Settings state & UI states
  const [appSettings, setAppSettings] = useState<Record<string, any>>({});
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [showGeminiGuide, setShowGeminiGuide] = useState(false);
  const [showIgGuide, setShowIgGuide] = useState(false);
  const [settingsSearch, setSettingsSearch] = useState("");

  // Gemini Test State
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<any>(null);

  // Instagram Test State
  const [igTesting, setIgTesting] = useState(false);
  const [igTestResult, setIgTestResult] = useState<any>(null);

  // Proxy & FaustRen Test State
  const [proxyTesting, setProxyTesting] = useState(false);
  const [proxyTestResult, setProxyTestResult] = useState<any>(null);
  const [faustrenTesting, setFaustrenTesting] = useState(false);
  const [faustrenTestResult, setFaustrenTestResult] = useState<any>(null);

  const testProxyConnection = async () => {
    setProxyTesting(true);
    setProxyTestResult(null);
    try {
      const pEl = document.getElementById("setting-PROXY_URL") as HTMLInputElement;
      const proxy_url = pEl?.value || appSettings["PROXY_URL"] || "";

      const res: any = await fetchApi("/admin/test-proxy", {
        method: "POST",
        body: JSON.stringify({ proxy_url })
      });
      setProxyTestResult(res);
      if (res.success) {
        flash("ok", res.message || "Proxy aktif & terhubung!");
      } else {
        flash("err", res.message || "Gagal terhubung ke Proxy.");
      }
    } catch (e: any) {
      setProxyTestResult({ success: false, message: e.message || "Terjadi kesalahan saat menguji proxy." });
      flash("err", "Test Proxy gagal");
    } finally {
      setProxyTesting(false);
    }
  };

  const testFaustRenScraper = async () => {
    setFaustrenTesting(true);
    setFaustrenTestResult(null);
    try {
      const pEl = document.getElementById("setting-PROXY_URL") as HTMLInputElement;
      const proxy_url = pEl?.value || appSettings["PROXY_URL"] || "";

      const res: any = await fetchApi("/admin/test-faustren", {
        method: "POST",
        body: JSON.stringify({ username: "instagram", proxy_url })
      });
      setFaustrenTestResult(res);
      if (res.success) {
        flash("ok", res.message || "Test FaustRen Scraper Berhasil!");
      } else {
        flash("err", res.message || "Gagal menguji FaustRen Scraper.");
      }
    } catch (e: any) {
      setFaustrenTestResult({ success: false, message: e.message || "Terjadi kesalahan saat menguji FaustRen Scraper." });
      flash("err", "Test FaustRen Scraper gagal");
    } finally {
      setFaustrenTesting(false);
    }
  };


  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadPlans();
    }
  }, [isAdmin]);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    flash("ok", `${label} tersalin ke clipboard!`);
  };

  const testInstagramConnection = async () => {
    setIgTesting(true);
    setIgTestResult(null);
    try {
      const uEl = document.getElementById("setting-INSTAGRAM_SCRAPER_USERNAME") as HTMLInputElement;
      const pEl = document.getElementById("setting-INSTAGRAM_SCRAPER_PASSWORD") as HTMLInputElement;
      const username = uEl?.value || appSettings["INSTAGRAM_SCRAPER_USERNAME"] || "";
      const password = pEl?.value || appSettings["INSTAGRAM_SCRAPER_PASSWORD"] || "";

      const res: any = await fetchApi("/admin/test-instagram", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      setIgTestResult(res);
      if (res.success) {
        flash("ok", res.message || "Koneksi Instagram berhasil!");
      } else {
        flash("err", res.message || "Gagal menghubungkan Instagram.");
      }
    } catch (e: any) {
      setIgTestResult({ success: false, message: e.message || "Terjadi kesalahan saat menguji Instagram." });
      flash("err", "Test Instagram gagal");
    } finally {
      setIgTesting(false);
    }
  };

  // ── Plans ──────────────────────────────────────────────────────────────────

  const loadPlans = async () => {
    try {
      const data: any = await fetchApi("/admin/plans");
      setPlans(data);
    } catch { }
  };

  const savePlan = async (planId: string) => {
    setPlanSaving(true);
    try {
      await fetchApi(`/admin/plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify(planEdits[planId] || {}),
      });
      flash("ok", "Plan updated!");
      setEditingPlan(null);
      loadPlans();
    } catch (e: any) {
      flash("err", "Failed to save plan");
    } finally {
      setPlanSaving(false);
    }
  };

  // ── Users ──────────────────────────────────────────────────────────────────

  const loadUserStats = async () => {
    try {
      const data: any = await fetchApi("/admin/users/stats");
      setUserStats(data);
    } catch { }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(usersPage),
        limit: String(usersLimit),
      });
      if (usersSearch.trim()) queryParams.set("search", usersSearch.trim());
      if (usersTier) queryParams.set("tier", usersTier);
      if (usersStatus) queryParams.set("status", usersStatus);
      if (usersIsAdminFilter) queryParams.set("is_admin", usersIsAdminFilter);

      const data: any = await fetchApi(`/admin/users?${queryParams.toString()}`);
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (e: any) {
      flash("err", e.message || "Gagal memuat daftar user.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users" && isAdmin) {
      loadUserStats();
      loadUsers();
    }
    if (activeTab === "settings" && isAdmin) {
      loadAppSettings();
    }
  }, [activeTab, usersPage, usersLimit, usersSearch, usersTier, usersStatus, usersIsAdminFilter, isAdmin]);

  const handleOpenEditUser = (u: any) => {
    setEditingUser(u);
    setEditTier(u.subscription?.plan_tier || "creator");
    setEditStatus(u.subscription?.status || "active");
    setEditPostsLimit(u.subscription?.posts_limit ?? 50);
    setEditPostsUsed(u.subscription?.posts_used ?? 0);
    setEditIsAdmin(u.is_admin || false);

    if (u.subscription?.expires_at) {
      const dt = new Date(u.subscription.expires_at);
      setEditExpiresAt(dt.toISOString().slice(0, 10)); // YYYY-MM-DD
    } else {
      setEditExpiresAt("");
    }
  };

  const handleSaveUserSubscription = async () => {
    if (!editingUser) return;
    setUserSaving(true);
    try {
      let expires_at_val: string | null = null;
      if (editExpiresAt) {
        expires_at_val = new Date(editExpiresAt + "T23:59:59").toISOString();
      }

      await fetchApi(`/admin/users/${editingUser.id}/subscription`, {
        method: "PUT",
        body: JSON.stringify({
          plan_tier: editTier,
          status: editStatus,
          expires_at: editExpiresAt ? expires_at_val : "null",
          posts_limit: editPostsLimit === "" ? null : Number(editPostsLimit),
          posts_used: editPostsUsed === "" ? null : Number(editPostsUsed),
          is_admin: editIsAdmin,
        }),
      });

      flash("ok", `User '${editingUser.email}' berhasil diperbarui!`);
      setEditingUser(null);
      loadUsers();
      loadUserStats();
    } catch (e: any) {
      flash("err", e.message || "Gagal menyimpan perubahan user.");
    } finally {
      setUserSaving(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!assignEmail.trim()) return;
    setAssignLoading(true);
    setAssignResult(null);
    try {
      const data: any = await fetchApi("/admin/assign-plan-by-email", {
        method: "POST",
        body: JSON.stringify({
          email: assignEmail.trim().toLowerCase(),
          plan_tier: assignTier,
          expires_days: assignDays || null,
          is_admin: assignIsAdmin,
        }),
      });
      setAssignResult({ 
        type: "ok", 
        text: `${data.message || "Plan berhasil di-assign!"}${assignIsAdmin ? " (Hak Akses Admin telah diberikan)" : ""}` 
      });
      setAssignEmail("");
      setAssignIsAdmin(false);
      loadUsers();
      loadUserStats();
    } catch (e: any) {
      setAssignResult({ type: "err", text: e.message || "Gagal assign plan." });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${userEmail}? Semua data user akan dihapus.`)) {
      return;
    }
    try {
      await fetchApi(`/admin/users/${userId}`, { method: "DELETE" });
      flash("ok", `User ${userEmail} berhasil dihapus.`);
      loadUsers();
      loadUserStats();
    } catch (e: any) {
      flash("err", e.message || "Gagal menghapus user.");
    }
  };

  const getExpiryBadge = (expiresAtStr?: string | null) => {
    if (!expiresAtStr) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
          Selamanya (Tanpa Expiry)
        </span>
      );
    }
    const exp = new Date(expiresAtStr);
    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">
          Expired {Math.abs(diffDays)} hr lalu ({exp.toLocaleDateString("id-ID")})
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
          Expired Hari Ini ({exp.toLocaleDateString("id-ID")})
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
          Exp {diffDays} hr lg ({exp.toLocaleDateString("id-ID")})
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-medium">
          Exp {diffDays} hr lg ({exp.toLocaleDateString("id-ID")})
        </span>
      );
    }
  };

  // ── App Settings ───────────────────────────────────────────────────────────

  const loadAppSettings = async () => {
    try {
      const data: any = await fetchApi("/admin/settings");
      setAppSettings(data);
    } catch { }
  };

  const saveSetting = async (key: string, value: any) => {
    setSettingsSaving(true);
    try {
      await fetchApi("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key, value }),
      });
      flash("ok", `Setting "${key}" saved!`);
      loadAppSettings();
    } catch { flash("err", "Failed to save setting"); } finally {
      setSettingsSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    try {
      await fetchApi(`/admin/settings/${key}`, { method: "DELETE" });
      flash("ok", `Setting "${key}" deleted`);
      loadAppSettings();
    } catch { flash("err", "Delete failed"); }
  };

  const testGeminiConnection = async () => {
    setGeminiTesting(true);
    setGeminiTestResult(null);
    try {
      const res: any = await fetchApi("/admin/test-gemini", { method: "POST" });
      setGeminiTestResult(res);
      if (res.success) {
        flash("ok", res.message || "Koneksi Gemini berhasil!");
      } else {
        flash("err", res.message || "Gagal menghubungkan Gemini.");
      }
    } catch (e: any) {
      setGeminiTestResult({ success: false, message: e.message || "Terjadi kesalahan saat menguji Gemini." });
      flash("err", "Test Gemini gagal");
    } finally {
      setGeminiTesting(false);
    }
  };

  // Helper renderers for API key inputs
  const renderApiKeyInput = (
    key: string,
    label: string,
    hint: string,
    placeholder: string = "Masukkan key...",
    badgeLabel?: string
  ) => {
    const isShow = !!showPasswordMap[key];
    const currentValue = appSettings[key] || "";
    const isConfigured = !!currentValue;

    return (
      <div key={key} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-200 transition-all space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-800 font-['Outfit']">{label}</label>
              {badgeLabel && (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-100">
                  {badgeLabel}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
            isConfigured ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {isConfigured ? "Aktif" : "Belum Set"}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={isShow ? "text" : "password"}
              defaultValue={currentValue}
              id={`setting-${key}`}
              placeholder={placeholder}
              className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50 font-mono text-slate-800"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(key)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              {isShow ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById(`setting-${key}`) as HTMLInputElement;
              if (el) saveSetting(key, el.value);
            }}
            disabled={settingsSaving}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-60 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      </div>
    );
  };

  const renderDarkApiKeyInput = (
    key: string,
    label: string,
    hint: string,
    accentColor: "purple" | "pink" | "amber" | "indigo" = "purple"
  ) => {
    const isShow = !!showPasswordMap[key];
    const currentValue = appSettings[key] || "";
    const isConfigured = !!currentValue;

    const focusRing = accentColor === "pink" ? "focus:ring-pink-400" : accentColor === "amber" ? "focus:ring-amber-400" : accentColor === "indigo" ? "focus:ring-indigo-400" : "focus:ring-purple-400";
    const btnBg = accentColor === "pink" ? "bg-pink-600 hover:bg-pink-500" : accentColor === "amber" ? "bg-amber-600 hover:bg-amber-500 font-bold" : accentColor === "indigo" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-purple-600 hover:bg-purple-500";


    return (
      <div key={key} className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-2 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <label className="text-xs font-semibold text-white block">{label}</label>
            <p className="text-[10px] text-slate-300">{hint}</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
            isConfigured ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          }`}>
            {isConfigured ? "Connected" : "Not Set"}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={isShow ? "text" : "password"}
              defaultValue={typeof currentValue === "object" ? JSON.stringify(currentValue) : currentValue}
              id={`setting-${key}`}
              placeholder="Masukkan value..."
              className={`w-full pl-3 pr-10 py-2 rounded-xl border border-white/20 text-xs bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${focusRing} font-mono`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(key)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
            >
              {isShow ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById(`setting-${key}`) as HTMLInputElement;
              if (el) saveSetting(key, el.value);
            }}
            disabled={settingsSaving}
            className={`px-3.5 py-2 rounded-xl ${btnBg} text-white text-xs font-semibold transition-all disabled:opacity-60 shrink-0 flex items-center gap-1 cursor-pointer`}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </div>
      </div>
    );
  };


  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "plans", label: "Subscription Plans", icon: CreditCard },
    { key: "users", label: "User & Admin Access", icon: Users },
    { key: "settings", label: "App Settings & API Keys", icon: Key },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-purple-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit']">Admin Control Panel</h1>
            <p className="text-xs text-purple-300">Super Admin Privileges · Shiera SaaS Portal</p>
          </div>
        </div>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          msg.type === "ok"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {msg.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              id={`admin-tab-${t.key}`}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === t.key
                  ? "bg-white shadow text-purple-700 border border-purple-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── PLANS TAB ── */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 bg-purple-50 border border-purple-100 p-3.5 rounded-2xl flex items-center gap-2">
            <span>💡</span>
            <span>
              Atur harga paket (IDR/USD), kuota post per periode, durasi hari, serta fitur-fitur paket di bawah. Pembayaran otomatis terintegrasi dengan <strong>Midtrans Payment Gateway</strong>.
            </span>
          </p>

          {plans.map((plan) => {
            const Icon = TIER_ICONS[plan.tier] || Zap;
            const isEditing = editingPlan === plan.id;
            const edits = planEdits[plan.id] || {};

            const featuresText = Array.isArray(edits.features) 
              ? edits.features.join("\n") 
              : (plan.features || []).join("\n");

            return (
              <div key={plan.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${TIER_COLORS[plan.tier]} flex items-center justify-center font-bold`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-slate-900 text-base font-['Outfit']">{plan.name}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          plan.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {plan.is_active !== false ? "Aktif" : "Non-Aktif"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Tier: <span className="font-semibold uppercase">{plan.tier}</span> · Rp {Number(plan.price_idr || 0).toLocaleString("id-ID")} · {plan.post_quota} Posts · {plan.duration_days} Hari
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => { 
                          setEditingPlan(plan.id); 
                          setPlanEdits((p: any) => ({ ...p, [plan.id]: { ...plan } })); 
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Pricing
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button 
                          onClick={() => setEditingPlan(null)} 
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => savePlan(plan.id)}
                          disabled={planSaving}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all disabled:opacity-60 shadow-md shadow-purple-500/20 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Simpan
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Paket</label>
                        <input
                          type="text"
                          value={edits.name ?? ""}
                          onChange={(e) => setPlanEdits((p: any) => ({
                            ...p,
                            [plan.id]: { ...p[plan.id], name: e.target.value }
                          }))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Harga (IDR / Rupiah)</label>
                        <input
                          type="number"
                          value={edits.price_idr ?? ""}
                          onChange={(e) => setPlanEdits((p: any) => ({
                            ...p,
                            [plan.id]: { ...p[plan.id], price_idr: Number(e.target.value) }
                          }))}
                          placeholder="e.g. 49000"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Harga (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={edits.price_usd ?? ""}
                          onChange={(e) => setPlanEdits((p: any) => ({
                            ...p,
                            [plan.id]: { ...p[plan.id], price_usd: Number(e.target.value) }
                          }))}
                          placeholder="e.g. 3.00"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Kuota Post Per Periode</label>
                        <input
                          type="number"
                          value={edits.post_quota ?? ""}
                          onChange={(e) => setPlanEdits((p: any) => ({
                            ...p,
                            [plan.id]: { ...p[plan.id], post_quota: Number(e.target.value) }
                          }))}
                          placeholder="e.g. 50"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Durasi Paket (Hari)</label>
                        <input
                          type="number"
                          value={edits.duration_days ?? ""}
                          onChange={(e) => setPlanEdits((p: any) => ({
                            ...p,
                            [plan.id]: { ...p[plan.id], duration_days: Number(e.target.value) }
                          }))}
                          placeholder="30"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                        <input
                          type="text"
                          value={edits.description ?? ""}
                          onChange={(e) => setPlanEdits((p: any) => ({
                            ...p,
                            [plan.id]: { ...p[plan.id], description: e.target.value }
                          }))}
                          placeholder="Deskripsi singkat paket..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="relative flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={edits.is_active !== false}
                            onChange={(e) => setPlanEdits((p: any) => ({
                              ...p,
                              [plan.id]: { ...p[plan.id], is_active: e.target.checked }
                            }))}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700">Aktifkan Paket Ini</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Daftar Fitur (Satu fitur per baris)
                      </label>
                      <textarea
                        rows={5}
                        value={featuresText}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n");
                          setPlanEdits((p: any) => ({
                            ...p,
                            [plan.id]: { ...p[plan.id], features: lines }
                          }));
                        }}
                        placeholder="Unlimited akun sosmed&#10;50 posts/bulan&#10;KOL Manager"
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Features Included:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(plan.features || []).map((feat: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div className="space-y-6">

          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total User</p>
                <p className="text-xl font-black text-slate-900 font-['Outfit']">{userStats?.total_users ?? totalUsers}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hak Akses Admin</p>
                <p className="text-xl font-black text-purple-700 font-['Outfit']">{userStats?.total_admins ?? 0}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Langganan Aktif</p>
                <p className="text-xl font-black text-emerald-600 font-['Outfit']">{userStats?.active_subs ?? 0}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 font-bold">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expired / Batal</p>
                <p className="text-xl font-black text-red-600 font-['Outfit']">{userStats?.expired_subs ?? 0}</p>
              </div>
            </div>
          </div>

          {/* ── Assign Plan & Admin Access Box ── */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/40 to-slate-50 border border-purple-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 font-['Outfit']">Tambah User &amp; Assign Hak Akses Admin / Paket</p>
                  <p className="text-[11px] text-slate-500">Input email &rarr; tentukan paket &amp; beri hak akses Admin Control Panel jika diperlukan</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center gap-1 border border-purple-200">
                <Shield className="w-3 h-3" /> Direct Admin Privileges
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email User</label>
                <input
                  id="assign-email-input"
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="admin-baru@email.com"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tier Paket Subscription</label>
                <select
                  id="assign-tier-select"
                  value={assignTier}
                  onChange={(e) => setAssignTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-semibold cursor-pointer"
                >
                  <option value="trial">Trial (3 hari)</option>
                  <option value="creator">Creator</option>
                  <option value="agency">Agency</option>
                  <option value="studio">Studio</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Durasi (hari, 0 = selamanya)</label>
                <input
                  id="assign-days-input"
                  type="number"
                  value={assignDays}
                  onChange={(e) => setAssignDays(Number(e.target.value))}
                  placeholder="30"
                  min={0}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-mono"
                />
              </div>

              <div className="flex items-end pb-0.5">
                <label className="w-full p-2 rounded-xl bg-white border border-purple-200 flex items-center justify-between cursor-pointer hover:bg-purple-50/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-800">Akses Admin</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignIsAdmin}
                    onChange={(e) => setAssignIsAdmin(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {assignResult && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                assignResult.type === "ok"
                  ? "bg-emerald-100 border border-emerald-300 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {assignResult.type === "ok" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {assignResult.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                id="assign-plan-submit"
                onClick={handleAssignPlan}
                disabled={assignLoading || !assignEmail.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {assignLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                {assignLoading ? "Memproses..." : assignIsAdmin ? "Simpan User & Beri Akses Admin" : "Assign Plan Sekarang"}
              </button>
            </div>
          </div>

          {/* ── Search & Filter Controls ── */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="w-full md:w-80 relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setUsersPage(1);
                      setUsersSearch(searchInput);
                    }
                  }}
                  placeholder="Cari nama atau email user..."
                  className="w-full pl-9 pr-16 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50"
                />
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setUsersSearch("");
                      setUsersPage(1);
                    }}
                    className="absolute right-12 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setUsersPage(1);
                    setUsersSearch(searchInput);
                  }}
                  className="absolute right-1.5 px-2 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  Cari
                </button>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                {/* Filter Admin Access */}
                <div className="flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                  <Shield className="w-3 h-3 text-purple-600" />
                  <span className="text-[11px] font-bold text-purple-900">Hak Akses:</span>
                  <select
                    value={usersIsAdminFilter}
                    onChange={(e) => {
                      setUsersIsAdminFilter(e.target.value);
                      setUsersPage(1);
                    }}
                    className="bg-transparent text-xs font-bold text-purple-800 focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua User</option>
                    <option value="true">Hanya Admin</option>
                    <option value="false">User Biasa</option>
                  </select>
                </div>

                {/* Filter Tier */}
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <Filter className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px] font-medium text-slate-600">Tier:</span>
                  <select
                    value={usersTier}
                    onChange={(e) => {
                      setUsersTier(e.target.value);
                      setUsersPage(1);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Tier</option>
                    <option value="trial">Trial</option>
                    <option value="creator">Creator</option>
                    <option value="agency">Agency</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>

                {/* Filter Status */}
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px] font-medium text-slate-600">Status:</span>
                  <select
                    value={usersStatus}
                    onChange={(e) => {
                      setUsersStatus(e.target.value);
                      setUsersPage(1);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Status</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>

                {/* Items Per Page */}
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-600">Per Hal:</span>
                  <select
                    value={usersLimit}
                    onChange={(e) => {
                      setUsersLimit(Number(e.target.value));
                      setUsersPage(1);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Refresh */}
                <button
                  onClick={() => {
                    loadUsers();
                    loadUserStats();
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ── User Data Table ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {usersLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Tidak ada user ditemukan yang sesuai dengan pencarian / filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Hak Akses Admin</th>
                      <th className="py-3 px-4">Paket & Status</th>
                      <th className="py-3 px-4">Masa Kadaluarsa (Expiry)</th>
                      <th className="py-3 px-4">Penggunaan Quota</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {users.map((u) => {
                      const sub = u.subscription;
                      const tier = sub?.plan_tier || "No Plan";
                      const status = sub?.status || "inactive";

                      const statusColor =
                        status === "active"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : status === "trial"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : status === "expired"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-slate-100 text-slate-600 border-slate-200";

                      const postsUsed = sub?.posts_used || 0;
                      const postsLimit = sub?.posts_limit || 0;
                      const quotaPercent = postsLimit > 0 ? Math.min(100, Math.round((postsUsed / postsLimit) * 100)) : 0;

                      return (
                        <tr key={u.id} className="hover:bg-purple-50/20 transition-colors">
                          {/* User Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.email}`}
                                className="w-9 h-9 rounded-full border border-slate-200 object-cover shrink-0"
                                alt=""
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-slate-900 truncate">{u.full_name}</p>
                                </div>
                                <p className="text-slate-400 text-[11px] truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Hak Akses Admin Badge */}
                          <td className="py-3.5 px-4">
                            {u.is_admin ? (
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-[11px] font-extrabold border border-purple-200 inline-flex items-center gap-1 shadow-2xs">
                                <Shield className="w-3 h-3 text-purple-600" /> Admin
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium border border-slate-200">
                                User Regular
                              </span>
                            )}
                          </td>

                          {/* Paket & Status */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {sub ? (
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIER_COLORS[tier] || "bg-slate-100 text-slate-600"}`}>
                                    {sub.plan_name || tier.toUpperCase()}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                    {status.toUpperCase()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Belum Ada Paket</span>
                              )}
                            </div>
                          </td>

                          {/* Masa Kadaluarsa */}
                          <td className="py-3.5 px-4">
                            {sub ? (
                              getExpiryBadge(sub.expires_at)
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
                            )}
                          </td>

                          {/* Quota Usage */}
                          <td className="py-3.5 px-4">
                            {sub ? (
                              <div className="w-36 space-y-1">
                                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                                  <span>{postsUsed}/{postsLimit} posts</span>
                                  <span>{quotaPercent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      quotaPercent >= 90
                                        ? "bg-red-500"
                                        : quotaPercent >= 70
                                        ? "bg-amber-500"
                                        : "bg-purple-600"
                                    }`}
                                    style={{ width: `${quotaPercent}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Edit Role & Subscription User"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {!u.is_admin && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  title="Hapus User"
                                  className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Pagination Footer Bar ── */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Menampilkan <span className="font-bold text-slate-900">{users.length}</span> dari <span className="font-bold text-slate-900">{totalUsers}</span> user · Halaman <span className="font-bold text-slate-900">{usersPage}</span> dari <span className="font-bold text-slate-900">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  disabled={usersPage <= 1 || usersLoading}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                <div className="flex items-center gap-1 px-2">
                  <span className="text-slate-400">Hal</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={usersPage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 1 && val <= totalPages) setUsersPage(val);
                    }}
                    className="w-12 px-2 py-1 rounded-lg border border-slate-200 text-center text-xs font-bold bg-white"
                  />
                  <span className="text-slate-400">/ {totalPages}</span>
                </div>

                <button
                  onClick={() => setUsersPage((p) => Math.min(totalPages, p + 1))}
                  disabled={usersPage >= totalPages || usersLoading}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── EDIT USER SUBSCRIPTION & ADMIN ROLE MODAL ── */}
          {editingUser && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={editingUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${editingUser.email}`}
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                      alt=""
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-['Outfit']">{editingUser.full_name}</h3>
                      <p className="text-xs text-slate-400">{editingUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Admin Toggle Box */}
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-purple-950">Hak Akses Admin Control Panel</p>
                        <p className="text-[10px] text-purple-700">Berikan akses penuh ke menu Admin &amp; API Key</p>
                      </div>
                    </div>
                    <label className="relative flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editIsAdmin}
                        onChange={(e) => setEditIsAdmin(e.target.checked)}
                        className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Tier & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tier Paket</label>
                      <select
                        value={editTier}
                        onChange={(e) => setEditTier(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                      >
                        <option value="trial">Trial</option>
                        <option value="creator">Creator</option>
                        <option value="agency">Agency</option>
                        <option value="studio">Studio</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Subscription</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                      >
                        <option value="active">Active (Aktif)</option>
                        <option value="trial">Trial (Uji Coba)</option>
                        <option value="expired">Expired (Kadaluarsa)</option>
                        <option value="cancelled">Cancelled (Dibatalkan)</option>
                        <option value="past_due">Past Due (Menunggak)</option>
                      </select>
                    </div>
                  </div>

                  {/* Expiry Date Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tanggal Expiry / Kadaluarsa (Kosongkan = Tanpa Batas / Selamanya)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editExpiresAt}
                        onChange={(e) => setEditExpiresAt(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      {editExpiresAt && (
                        <button
                          type="button"
                          onClick={() => setEditExpiresAt("")}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quota Limit & Used */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Limit Post (Posts Limit)</label>
                      <input
                        type="number"
                        value={editPostsLimit}
                        onChange={(e) => setEditPostsLimit(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Post Terpakai (Posts Used)</label>
                      <input
                        type="number"
                        value={editPostsUsed}
                        onChange={(e) => setEditPostsUsed(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 0"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveUserSubscription}
                    disabled={userSaving}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {userSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{userSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS & API KEYS TAB ── */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          
          {/* Header Info Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-500/20">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                <Key className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-['Outfit'] flex items-center gap-2">
                  Integrasi API Keys &amp; Lisensi System Shiera
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-semibold border border-purple-400/30">
                    Commercial License
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Kelola kredensial AI engine, scraper sosmed, payment gateway, dan layanan WhatsApp OTP untuk client Shiera.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Database Secured
              </span>
            </div>
          </div>

          {/* ── SECTION 1: SHIERA AI ENGINE CONFIGURATION ── */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white shadow-xl space-y-4 border border-purple-500/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Outfit'] text-white">Shiera AI Engine Configuration (Google Gemini)</h3>
                  <p className="text-xs text-purple-200">Kredensial AI untuk memproses konten, caption, summary &amp; analytics seluruh client Shiera</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGeminiGuide(!showGeminiGuide)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showGeminiGuide ? "Tutup Petunjuk" : "Petunjuk Ambil Cookie"}</span>
                  {showGeminiGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={testGeminiConnection}
                  disabled={geminiTesting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {geminiTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  {geminiTesting ? "Mengecek Koneksi..." : "Test Koneksi Shiera AI"}
                </button>
              </div>
            </div>

            {/* Collapsible Instruction box */}
            {showGeminiGuide && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-purple-100 space-y-2 animate-in fade-in duration-200">
                <p className="font-bold text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" /> Cara Ambil Session Cookie Gemini untuk Shiera AI:
                </p>
                <ol className="list-decimal list-inside text-[11px] text-purple-200/90 space-y-1 pl-1">
                  <li>Buka <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="underline text-amber-300 font-semibold">gemini.google.com</a> di browser dan pastikan sudah login.</li>
                  <li>Tekan <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">F12</kbd> &rarr; tab <strong>Application</strong> &rarr; <strong>Cookies</strong> &rarr; <strong>gemini.google.com</strong>.</li>
                  <li>Salin nilai cookie <code className="bg-purple-950/80 px-1.5 py-0.5 rounded font-mono text-amber-200">__Secure-1PSID</code> dan <code className="bg-purple-950/80 px-1.5 py-0.5 rounded font-mono text-amber-200">__Secure-1PSIDTS</code> ke input di bawah.</li>
                </ol>
              </div>
            )}

            {/* Input fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {renderDarkApiKeyInput("GEMINI_1PSID", "__Secure-1PSID (Session Utama)", "Wajib untuk AI Engine", "purple")}
              {renderDarkApiKeyInput("GEMINI_1PSIDTS", "__Secure-1PSIDTS (Session TS)", "Wajib jika akun minta 1PSIDTS", "purple")}
              {renderDarkApiKeyInput("GEMINI_API_KEY", "API Key (Fallback AI)", "AIzaSy... (Opsional fallback)", "purple")}
            </div>

            {/* Test Connection Result Box */}
            {geminiTestResult && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
                geminiTestResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : "bg-red-500/10 border-red-500/30 text-red-200"
              }`}>
                {geminiTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{geminiTestResult.message}</p>
                  {geminiTestResult.provider && (
                    <p className="text-[11px] opacity-80 mt-0.5">Provider aktif: <strong>{geminiTestResult.provider}</strong></p>
                  )}
                  {geminiTestResult.sample && (
                    <p className="text-[10px] font-mono mt-1 bg-black/40 p-2 rounded-xl opacity-90 truncate max-w-xl">
                      Response Test: "{geminiTestResult.sample}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 2: INSTAGRAPI COMPETITOR SPY ENGINE ── */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950 text-white shadow-xl space-y-4 border border-pink-500/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300">
                  <Bot className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Outfit'] text-white">Instagram Competitor Spy Engine</h3>
                  <p className="text-xs text-pink-200">Auto-Refresh Session &amp; Scraper credentials khusus fitur analisa kompetitor</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowIgGuide(!showIgGuide)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-pink-200 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showIgGuide ? "Tutup Info" : "Info Login Direct"}</span>
                  {showIgGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={testInstagramConnection}
                  disabled={igTesting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-lg shadow-pink-500/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {igTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  {igTesting ? "Mengecek Session..." : "Test Koneksi Instagram"}
                </button>
              </div>
            </div>

            {/* Collapsible Instruction box */}
            {showIgGuide && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-pink-100 space-y-1 animate-in fade-in duration-200">
                <p className="font-bold text-pink-200">💡 Bebas Input Cookie Manual:</p>
                <p className="text-[11px] text-pink-300/90">
                  Cukup masukkan Username &amp; Password akun Instagram scraper (akun sekunder), lalu klik <strong>Test Koneksi Instagram</strong>. Backend akan otomatis melakukan login &amp; me-refresh session cookie secara mandiri!
                </p>
              </div>
            )}

            {/* Credentials Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {renderDarkApiKeyInput("INSTAGRAM_SCRAPER_USERNAME", "INSTAGRAM_SCRAPER_USERNAME", "Username akun IG scraper", "pink")}
              {renderDarkApiKeyInput("INSTAGRAM_SCRAPER_PASSWORD", "INSTAGRAM_SCRAPER_PASSWORD", "Password akun IG scraper", "pink")}
            </div>

            {/* Challenge Resolver Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-300" /> Challenge &amp; Captcha Resolver (Auto IMAP / 2FA TOTP)
                </h4>
                <p className="text-[11px] text-pink-300/80 mt-0.5">
                  Terapkan 2FA Secret Key atau IMAP Email agar sistem otomatis membaca OTP saat Instagram meminta verifikasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {renderDarkApiKeyInput("INSTAGRAM_2FA_SEED", "INSTAGRAM_2FA_SEED", "2FA Secret Key (TOTP)", "amber")}
                {renderDarkApiKeyInput("INSTAGRAM_CHALLENGE_EMAIL", "CHALLENGE_EMAIL", "Email akun IG", "pink")}
                {renderDarkApiKeyInput("INSTAGRAM_CHALLENGE_EMAIL_PASSWORD", "EMAIL_PASSWORD", "Gmail App Password", "pink")}
                {renderDarkApiKeyInput("INSTAGRAM_CHALLENGE_CODE", "CHALLENGE_CODE", "Kode OTP Manual 6-digit", "amber")}
              </div>
            </div>

            {/* Session Dump Cookie Input */}
            {renderDarkApiKeyInput("INSTAGRAM_SESSION_COOKIE", "INSTAGRAM_SESSION_COOKIE (Auto-Dump)", "Terisi otomatis saat auto-login berhasil", "pink")}

            {/* Test Connection Result Box */}
            {igTestResult && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
                igTestResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : "bg-red-500/10 border-red-500/30 text-red-200"
              }`}>
                {igTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{igTestResult.message}</p>
                  {igTestResult.username && (
                    <p className="text-[11px] opacity-80 mt-0.5">Logged in as: <strong>@{igTestResult.username}</strong> ({igTestResult.full_name})</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 2B: RESIDENTIAL PROXY & FAUSTREN SCRAPER SETTINGS ── */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white shadow-xl space-y-4 border border-indigo-500/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Globe className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Outfit'] text-white">Residential Proxy &amp; Competitor Scraper Engine</h3>
                  <p className="text-xs text-indigo-200">Konfigurasi FaustRen Scraper (Tanpa Login) &amp; Residential Proxy Anti-Block</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={testProxyConnection}
                  disabled={proxyTesting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {proxyTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 text-amber-300" />}
                  {proxyTesting ? "Mengecek Proxy..." : "Test Koneksi Proxy"}
                </button>

                <button
                  type="button"
                  onClick={testFaustRenScraper}
                  disabled={faustrenTesting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {faustrenTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  {faustrenTesting ? "Menguji Scraper..." : "Test Instagrapi Scraper"}
                </button>
              </div>
            </div>

            {/* Input fields for Scraper Engine Choice & Proxy Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Scraper Engine Select */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-2 backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white block">SCRAPER_ENGINE</label>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Engine Utama
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">Pilih engine scraper aktif</p>
                <div className="flex gap-2">
                  <select
                    id="setting-SCRAPER_ENGINE"
                    defaultValue={appSettings["SCRAPER_ENGINE"] || "instagrapi"}
                    className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-sans"
                  >
                    <option value="instagrapi">Instagrapi Engine (With Proxy & Session)</option>
                    <option value="apify">Apify Managed API</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("setting-SCRAPER_ENGINE") as HTMLSelectElement;
                      if (el) saveSetting("SCRAPER_ENGINE", el.value);
                    }}
                    disabled={settingsSaving}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </div>

              {/* Enable Proxy Toggle */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-2 backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white block">PROXY_ENABLED</label>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    String(appSettings["PROXY_ENABLED"] ?? "true").toLowerCase() === "true" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-500/20 text-slate-400"
                  }`}>
                    {String(appSettings["PROXY_ENABLED"] ?? "true").toLowerCase() === "true" ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">Aktifkan Residential Proxy</p>
                <div className="flex gap-2">
                  <select
                    id="setting-PROXY_ENABLED"
                    defaultValue={String(appSettings["PROXY_ENABLED"] ?? "true")}
                    className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-sans"
                  >
                    <option value="true">Aktif (Enabled)</option>
                    <option value="false">Non-Aktif (Disabled)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("setting-PROXY_ENABLED") as HTMLSelectElement;
                      if (el) saveSetting("PROXY_ENABLED", el.value);
                    }}
                    disabled={settingsSaving}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </div>

              {/* Proxy Connection String Input */}
              {renderDarkApiKeyInput("PROXY_URL", "PROXY_URL / Connection String", "http://user:pass@host:port", "indigo")}
            </div>

            {/* Results Badges */}
            {proxyTestResult && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
                proxyTestResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : "bg-red-500/10 border-red-500/30 text-red-200"
              }`}>
                {proxyTestResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{proxyTestResult.message}</p>
                  {proxyTestResult.ip && <p className="text-[11px] opacity-80 mt-0.5">IP Publik Terdeteksi: <strong>{proxyTestResult.ip}</strong></p>}
                </div>
              </div>
            )}

            {faustrenTestResult && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
                faustrenTestResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : "bg-red-500/10 border-red-500/30 text-red-200"
              }`}>
                {faustrenTestResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{faustrenTestResult.message}</p>
                </div>
              </div>
            )}
          </div>


          {/* ── SECTION 3: THIRD-PARTY INTEGRATIONS (PAYMENTS & MESSAGING) ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-['Outfit'] flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-600" /> Integrasi Payment Gateway &amp; Service Provider
                </h3>
                <p className="text-xs text-slate-500">Kredensial API untuk Midtrans Gateway, PostForMe Social Engine, dan WhatsApp OTP</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderApiKeyInput("POSTFORME_API_KEY", "PostForMe API Key", "API key dari postforme.dev untuk auto posting sosmed", "pk_live_...", "Social Engine")}
              {renderApiKeyInput("MIDTRANS_SERVER_KEY", "Midtrans Server Key", "Server key dari dashboard.midtrans.com (Production / Sandbox)", "Mid-server-...", "Payment Gateway")}
              {renderApiKeyInput("MIDTRANS_CLIENT_KEY", "Midtrans Client Key", "Client key dari dashboard.midtrans.com", "Mid-client-...", "Payment Client")}
              {renderApiKeyInput("FONNTE_API_TOKEN", "Fonnte WhatsApp Token", "Token fonnte.com untuk OTP WhatsApp & Notifikasi", "Token Fonnte...", "WhatsApp OTP")}
            </div>
          </div>

          {/* ── SECTION 4: MANAGEMENT TABLE OF ALL SAVED KEYS & CUSTOM KEYS ── */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-['Outfit']">Daftar Seluruh Key &amp; Settings Terdaftar</h3>
                <p className="text-xs text-slate-500">Semua variabel konfigurasi yang saat ini tersimpan di database Shiera</p>
              </div>

              {/* Search Bar for settings */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={settingsSearch}
                  onChange={(e) => setSettingsSearch(e.target.value)}
                  placeholder="Filter nama key..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Settings Table */}
            {Object.keys(appSettings).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                Belum ada setting yang tersimpan di database.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Nama Key</th>
                      <th className="py-2.5 px-4">Nilai / Value</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {Object.entries(appSettings)
                      .filter(([key]) => key.toLowerCase().includes(settingsSearch.toLowerCase()))
                      .map(([key, value]) => {
                        const valStr = typeof value === "object" ? JSON.stringify(value) : String(value || "");
                        const isMasked = !showPasswordMap[`table-${key}`];
                        const displayVal = isMasked && valStr.length > 8
                          ? `${valStr.slice(0, 4)}${"•".repeat(12)}${valStr.slice(-4)}`
                          : valStr;

                        return (
                          <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-purple-900">
                              {key}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                              <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                                {displayVal || <span className="italic text-slate-400">(kosong)</span>}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1 font-sans">
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(`table-${key}`)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title={isMasked ? "Tampilkan" : "Sembunyikan"}
                                >
                                  {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(valStr, key)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Copy Value"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteSetting(key)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Hapus Key"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Custom Setting Form Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-600" /> Tambah Key Custom Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  value={newSettingKey}
                  onChange={(e) => setNewSettingKey(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                  placeholder="KEY_NAME_BARU"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono bg-white"
                />
                <input
                  value={newSettingValue}
                  onChange={(e) => setNewSettingValue(e.target.value)}
                  placeholder="Value key..."
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                />
                <button
                  onClick={() => { 
                    if (newSettingKey) { 
                      saveSetting(newSettingKey, newSettingValue); 
                      setNewSettingKey(""); 
                      setNewSettingValue(""); 
                    } 
                  }}
                  disabled={!newSettingKey.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
