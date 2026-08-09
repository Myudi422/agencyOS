"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Settings, Users, CreditCard, Key, RefreshCw,
  Save, Edit2, ChevronRight, Shield, Trash2, Plus,
  CheckCircle, AlertTriangle, Zap, Crown, Rocket, Building2,
  Sparkles, Bot, CheckCircle2, XCircle, Search, Filter, Clock,
  Calendar, ChevronLeft, X, UserCheck, UserX, SlidersHorizontal, Check
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

  // Assign plan state
  const [assignEmail, setAssignEmail] = useState("");
  const [assignTier, setAssignTier] = useState("agency");
  const [assignDays, setAssignDays] = useState(30);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignResult, setAssignResult] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Settings state
  const [appSettings, setAppSettings] = useState<Record<string, any>>({});
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Gemini Test State
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<any>(null);

  // Instagram Test State
  const [igTesting, setIgTesting] = useState(false);
  const [igTestResult, setIgTestResult] = useState<any>(null);

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
  }, [activeTab, usersPage, usersLimit, usersSearch, usersTier, usersStatus, isAdmin]);

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
        }),
      });
      setAssignResult({ type: "ok", text: data.message || "Plan berhasil di-assign!" });
      setAssignEmail("");
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


  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "plans", label: "Subscription Plans", icon: CreditCard },
    { key: "users", label: "User Management", icon: Users },
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
            <p className="text-xs text-purple-300">Full access · myudi422@gmail.com</p>
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
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

            // Format features list into newline string for textarea editing
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
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Pricing
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button 
                          onClick={() => setEditingPlan(null)} 
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => savePlan(plan.id)}
                          disabled={planSaving}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all disabled:opacity-60 shadow-md shadow-purple-500/20"
                        >
                          <Save className="w-3.5 h-3.5" /> Simpan
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Extended Edit Panel */}
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
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
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
                  /* Read-Only Features Preview */
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

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Admin</p>
                <p className="text-xl font-black text-amber-600 font-['Outfit']">{userStats?.total_admins ?? 0}</p>
              </div>
            </div>
          </div>

          {/* ── Assign Plan by Email Box ── */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900 font-['Outfit']">Quick Assign Plan ke User</p>
                <p className="text-[11px] text-emerald-600">Input email &rarr; pilih paket &rarr; langsung aktifkan tanpa transaksi online</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-emerald-800 mb-1">Email User</label>
                <input
                  id="assign-email-input"
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-emerald-800 mb-1">Tier Paket</label>
                <select
                  id="assign-tier-select"
                  value={assignTier}
                  onChange={(e) => setAssignTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-semibold"
                >
                  <option value="trial">Trial (3 hari)</option>
                  <option value="creator">Creator</option>
                  <option value="agency">Agency</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-emerald-800 mb-1">Durasi (hari, 0 = selamanya)</label>
                <input
                  id="assign-days-input"
                  type="number"
                  value={assignDays}
                  onChange={(e) => setAssignDays(Number(e.target.value))}
                  placeholder="30"
                  min={0}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-mono"
                />
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

            <button
              id="assign-plan-submit"
              onClick={handleAssignPlan}
              disabled={assignLoading || !assignEmail.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {assignLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {assignLoading ? "Memproses..." : "Assign Plan Sekarang"}
            </button>
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
                  placeholder="Cari nama atau email..."
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
                  className="absolute right-1.5 px-2 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700 transition-colors"
                >
                  Cari
                </button>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
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

                      // Status pill color
                      const statusColor =
                        status === "active"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : status === "trial"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : status === "expired"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-slate-100 text-slate-600 border-slate-200";

                      // Progress bar calc
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
                                  {u.is_admin && (
                                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[9px] font-bold border border-purple-200 flex items-center gap-0.5">
                                      <Shield className="w-2.5 h-2.5" /> Admin
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-[11px] truncate">{u.email}</p>
                              </div>
                            </div>
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
                                title="Edit Status & Subscription User"
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

          {/* ── EDIT USER SUBSCRIPTION MODAL ── */}
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

                  {/* Admin Toggle */}
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-purple-900">Hak Akses Admin</p>
                      <p className="text-[10px] text-purple-600">Berikan atau cabut hak akses Admin Control Panel</p>
                    </div>
                    <label className="relative flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editIsAdmin}
                        onChange={(e) => setEditIsAdmin(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </label>
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

      {/* ── SETTINGS TAB ── */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            ⚠️ API Keys tersimpan di database. Untuk production, gunakan environment variables di Vercel.
          </div>

          {/* ── SHIERA AI ENGINE CONFIGURATION ── */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Outfit'] text-white">Shiera AI Engine Configuration</h3>
                  <p className="text-xs text-purple-200">Session credential admin digunakan untuk menjalankan fitur **Summary AI** seluruh pengguna Shiera</p>
                </div>
              </div>
              <button
                onClick={testGeminiConnection}
                disabled={geminiTesting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-60"
              >
                {geminiTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-amber-300" />
                )}
                {geminiTesting ? "Mengecek Koneksi..." : "Test Koneksi Shiera AI"}
              </button>
            </div>

            {/* Instruction box */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-purple-100 space-y-1">
              <p className="font-semibold text-purple-200">💡 Cara Mendapatkan Session Token Shiera AI Engine:</p>
              <ol className="list-decimal list-inside text-[11px] text-purple-300/90 space-y-0.5">
                <li>Buka <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="underline text-purple-200">gemini.google.com</a> di browser dan pastikan sudah login akun Google.</li>
                <li>Tekan <kbd className="px-1 bg-white/10 rounded">F12</kbd> &rarr; tab <strong>Application</strong> / <strong>Storage</strong> &rarr; <strong>Cookies</strong>.</li>
                <li>Cari cookie bernama <code className="bg-purple-950/80 px-1 py-0.5 rounded font-mono text-purple-200">__Secure-1PSID</code> dan <code className="bg-purple-950/80 px-1 py-0.5 rounded font-mono text-purple-200">__Secure-1PSIDTS</code>, lalu salin nilainya ke bawah.</li>
              </ol>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {[
                { key: "GEMINI_1PSID", label: "__Secure-1PSID (Session Utama)", hint: "Wajib untuk Shiera AI Engine" },
                { key: "GEMINI_1PSIDTS", label: "__Secure-1PSIDTS (Session TS)", hint: "Wajib jika akun memerlukan 1PSIDTS" },
                { key: "GEMINI_API_KEY", label: "API Key (Fallback Shiera AI)", hint: "AIzaSy... (Opsional jika session exp)" },
              ].map((s) => (

                <div key={s.key} className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-white block">{s.label}</label>
                    <p className="text-[10px] text-purple-300">{s.hint}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      defaultValue={appSettings[s.key] || ""}
                      id={`setting-${s.key}`}
                      placeholder="Masukkan value..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-white/20 text-xs bg-slate-900/60 text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(`setting-${s.key}`) as HTMLInputElement;
                        if (el) saveSetting(s.key, el.value);
                      }}
                      disabled={settingsSaving}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all disabled:opacity-60 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Test Connection Result Box */}
            {geminiTestResult && (
              <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
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
                    <p className="text-[11px] opacity-80">Provider aktif: <strong>{geminiTestResult.provider}</strong></p>
                  )}
                  {geminiTestResult.sample && (
                    <p className="text-[10px] font-mono mt-1 bg-black/30 p-2 rounded-lg opacity-90 truncate max-w-xl">
                      Response: "{geminiTestResult.sample}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── INSTAGRAPI COMPETITOR SPY CONFIGURATION ── */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-900 via-purple-900 to-slate-900 text-white shadow-xl space-y-4 border border-pink-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300">
                  <Bot className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Outfit'] text-white">Instagram Competitor Spy Engine</h3>
                  <p className="text-xs text-pink-200">Auto-Refresh Session & Credentials akun scraper khusus agencyOS</p>
                </div>
              </div>
              <button
                onClick={testInstagramConnection}
                disabled={igTesting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-lg shadow-pink-500/30 transition-all disabled:opacity-60"
              >
                {igTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                {igTesting ? "Mengecek Session..." : "Test Koneksi Instagram"}
              </button>
            </div>

            {/* Instruction box */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-pink-100 space-y-1">
              <p className="font-semibold text-pink-200">💡 Cara Mengaktifkan Auto-Refresh Session (Bebas Input Cookie Manual):</p>
              <ol className="list-decimal list-inside text-[11px] text-pink-300/90 space-y-0.5">
                <li>Masukkan <strong>Username</strong> &amp; <strong>Password</strong> akun Instagram scraper (akun sekunder) di bawah.</li>
                <li>Klik tombol <strong>Simpan</strong> pada masing-masing field.</li>
                <li>Klik <strong>Test Koneksi Instagram</strong>. Backend akan otomatis melakukan login &amp; me-refresh session cookie secara mandiri!</li>
              </ol>
            </div>

            {/* Input fields for Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-2">
                <div>
                  <label className="text-xs font-semibold text-white block">INSTAGRAM_SCRAPER_USERNAME</label>
                  <p className="text-[10px] text-pink-300">Username akun Instagram scraper</p>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    defaultValue={appSettings["INSTAGRAM_SCRAPER_USERNAME"] || ""}
                    id="setting-INSTAGRAM_SCRAPER_USERNAME"
                    placeholder="Username Instagram..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-white/20 text-xs bg-slate-900/60 text-white placeholder-pink-300/40 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById("setting-INSTAGRAM_SCRAPER_USERNAME") as HTMLInputElement;
                      if (el) saveSetting("INSTAGRAM_SCRAPER_USERNAME", el.value);
                    }}
                    disabled={settingsSaving}
                    className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition-all disabled:opacity-60 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-2">
                <div>
                  <label className="text-xs font-semibold text-white block">INSTAGRAM_SCRAPER_PASSWORD</label>
                  <p className="text-[10px] text-pink-300">Password akun Instagram scraper</p>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    defaultValue={appSettings["INSTAGRAM_SCRAPER_PASSWORD"] || ""}
                    id="setting-INSTAGRAM_SCRAPER_PASSWORD"
                    placeholder="Password Instagram..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-white/20 text-xs bg-slate-900/60 text-white placeholder-pink-300/40 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById("setting-INSTAGRAM_SCRAPER_PASSWORD") as HTMLInputElement;
                      if (el) saveSetting("INSTAGRAM_SCRAPER_PASSWORD", el.value);
                    }}
                    disabled={settingsSaving}
                    className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition-all disabled:opacity-60 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Challenge Resolver Config (IMAP Auto-Code Extraction & Manual Code Fallback) ── */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-pink-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-300" /> Challenge &amp; Captcha Resolver Settings (Auto IMAP / Manual 6-Digit OTP)
                </h4>
                <p className="text-[11px] text-pink-300/80 mt-0.5">
                  Gunakan email IMAP (Gmail App Password) agar sistem otomatis membaca kode verifikasi 6-digit saat Instagram memicu Challenge/Captcha security.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-amber-300 block">INSTAGRAM_2FA_SEED (Sangat Direkomendasikan)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      defaultValue={appSettings["INSTAGRAM_2FA_SEED"] || ""}
                      id="setting-INSTAGRAM_2FA_SEED"
                      placeholder="2FA Secret Key (TOTP)..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs bg-slate-900/60 text-amber-200 placeholder-pink-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById("setting-INSTAGRAM_2FA_SEED") as HTMLInputElement;
                        if (el) saveSetting("INSTAGRAM_2FA_SEED", el.value);
                      }}
                      disabled={settingsSaving}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-all disabled:opacity-60 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white block">INSTAGRAM_CHALLENGE_EMAIL</label>
                  <div className="flex gap-1.5">
                    <input
                      type="email"
                      defaultValue={appSettings["INSTAGRAM_CHALLENGE_EMAIL"] || ""}
                      id="setting-INSTAGRAM_CHALLENGE_EMAIL"
                      placeholder="email@gmail.com"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-white/20 text-xs bg-slate-900/60 text-white placeholder-pink-300/40 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById("setting-INSTAGRAM_CHALLENGE_EMAIL") as HTMLInputElement;
                        if (el) saveSetting("INSTAGRAM_CHALLENGE_EMAIL", el.value);
                      }}
                      disabled={settingsSaving}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition-all disabled:opacity-60 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white block">INSTAGRAM_CHALLENGE_EMAIL_PASSWORD</label>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      defaultValue={appSettings["INSTAGRAM_CHALLENGE_EMAIL_PASSWORD"] || ""}
                      id="setting-INSTAGRAM_CHALLENGE_EMAIL_PASSWORD"
                      placeholder="Gmail App Password..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-white/20 text-xs bg-slate-900/60 text-white placeholder-pink-300/40 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById("setting-INSTAGRAM_CHALLENGE_EMAIL_PASSWORD") as HTMLInputElement;
                        if (el) saveSetting("INSTAGRAM_CHALLENGE_EMAIL_PASSWORD", el.value);
                      }}
                      disabled={settingsSaving}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition-all disabled:opacity-60 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white block">INSTAGRAM_CHALLENGE_CODE (Manual Code)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      defaultValue={appSettings["INSTAGRAM_CHALLENGE_CODE"] || ""}
                      id="setting-INSTAGRAM_CHALLENGE_CODE"
                      placeholder="e.g. 123456"
                      maxLength={6}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs bg-slate-900/60 text-amber-200 placeholder-pink-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono font-bold"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById("setting-INSTAGRAM_CHALLENGE_CODE") as HTMLInputElement;
                        if (el) saveSetting("INSTAGRAM_CHALLENGE_CODE", el.value);
                      }}
                      disabled={settingsSaving}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-all disabled:opacity-60 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Manual Session Cookie Override */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div>
                <label className="text-xs font-semibold text-white block">INSTAGRAM_SESSION_COOKIE (Session Dump Auto-Generated)</label>
                <p className="text-[10px] text-pink-300">Terisi otomatis saat auto-login berhasil. Bisa diisi manual jika perlu.</p>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  defaultValue={typeof appSettings["INSTAGRAM_SESSION_COOKIE"] === "object" ? JSON.stringify(appSettings["INSTAGRAM_SESSION_COOKIE"]) : (appSettings["INSTAGRAM_SESSION_COOKIE"] || "")}
                  id="setting-INSTAGRAM_SESSION_COOKIE"
                  placeholder="Diisi otomatis oleh Auto-Session Engine..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-white/20 text-xs bg-slate-900/60 text-white placeholder-pink-300/40 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById("setting-INSTAGRAM_SESSION_COOKIE") as HTMLInputElement;
                    if (el) saveSetting("INSTAGRAM_SESSION_COOKIE", el.value);
                  }}
                  disabled={settingsSaving}
                  className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition-all disabled:opacity-60 shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Test Connection Result Box */}
            {igTestResult && (
              <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
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



          {/* Quick-add common settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: "POSTFORME_API_KEY", label: "PostForMe API Key", hint: "Dari dashboard postforme.dev" },
              { key: "MIDTRANS_SERVER_KEY", label: "Midtrans Server Key", hint: "Mid-server-... (Production / Sandbox)" },
              { key: "MIDTRANS_CLIENT_KEY", label: "Midtrans Client Key", hint: "Mid-client-..." },
              { key: "FONNTE_API_TOKEN", label: "Fonnte WhatsApp Token", hint: "Token dari fonnte.com untuk OTP WhatsApp" },
            ].map((s) => (
              <div key={s.key} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div>
                  <label className="text-xs font-bold text-slate-800">{s.label}</label>
                  <p className="text-[10px] text-slate-400">{s.hint}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    defaultValue={appSettings[s.key] || ""}
                    id={`setting-${s.key}`}
                    placeholder="Belum dikonfigurasi..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById(`setting-${s.key}`) as HTMLInputElement;
                      if (el) saveSetting(s.key, el.value);
                    }}
                    disabled={settingsSaving}
                    className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* All settings list */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">All Saved Settings</h3>
            {Object.keys(appSettings).length === 0 ? (
              <p className="text-xs text-slate-400">No settings saved yet.</p>
            ) : (
              Object.entries(appSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-bold text-slate-700">{key}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {typeof value === "string" && value.length > 10
                        ? `${value.slice(0, 6)}${"*".repeat(8)}${value.slice(-4)}`
                        : JSON.stringify(value)}
                    </p>
                  </div>
                  <button onClick={() => deleteSetting(key)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Custom setting */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Add Custom Setting</h3>
            <div className="flex gap-2">
              <input
                value={newSettingKey}
                onChange={(e) => setNewSettingKey(e.target.value)}
                placeholder="KEY_NAME"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
              />
              <input
                value={newSettingValue}
                onChange={(e) => setNewSettingValue(e.target.value)}
                placeholder="value"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={() => { if (newSettingKey) { saveSetting(newSettingKey, newSettingValue); setNewSettingKey(""); setNewSettingValue(""); } }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
