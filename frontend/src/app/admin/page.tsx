"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Settings, Users, CreditCard, Key, RefreshCw,
  Save, Edit2, ChevronRight, Shield, Trash2, Plus,
  CheckCircle, AlertTriangle, Zap, Crown, Rocket, Building2,
  Sparkles, Bot, CheckCircle2, XCircle
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

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

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
      const res: any = await fetchApi("/admin/test-instagram", { method: "POST" });
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

  const createStripePrice = async (planTier: string) => {
    try {
      await fetchApi(`/admin/plans/${planTier}/create-stripe-price`, { method: "POST" });
      flash("ok", `Stripe price created for ${planTier}!`);
      loadPlans();
    } catch (e: any) {
      flash("err", "Failed to create Stripe price. Check STRIPE_SECRET_KEY.");
    }
  };

  // ── Users ──────────────────────────────────────────────────────────────────

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data: any = await fetchApi("/admin/users");
      setUsers(data.users || []);
    } catch { } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users" && isAdmin) loadUsers();
    if (activeTab === "settings" && isAdmin) loadAppSettings();
  }, [activeTab]);

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
          <p className="text-xs text-slate-500 bg-purple-50 border border-purple-100 p-3 rounded-xl">
            💡 Semua paket memiliki <strong>Unlimited Social Accounts</strong>. Perbedaan hanya di kuota post.
            Setelah edit, kamu juga perlu setup Stripe Price ID untuk payment.
          </p>
          {plans.map((plan) => {
            const Icon = TIER_ICONS[plan.tier] || Zap;
            const isEditing = editingPlan === plan.id;
            const edits = planEdits[plan.id] || {};

            return (
              <div key={plan.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${TIER_COLORS[plan.tier]} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{plan.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{plan.tier} · ${plan.price_usd} · {plan.post_quota} posts · {plan.duration_days} days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => { setEditingPlan(plan.id); setPlanEdits((p: any) => ({ ...p, [plan.id]: { ...plan } })); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button onClick={() => setEditingPlan(null)} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium">Cancel</button>
                        <button
                          onClick={() => savePlan(plan.id)}
                          disabled={planSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-all disabled:opacity-60"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                    {[
                      { label: "Name", field: "name", type: "text" },
                      { label: "Price (USD)", field: "price_usd", type: "number" },
                      { label: "Post Quota", field: "post_quota", type: "number" },
                      { label: "Duration (days)", field: "duration_days", type: "number" },
                      { label: "Stripe Price ID", field: "stripe_price_id", type: "text" },
                    ].map(({ label, field, type }) => (
                      <div key={field} className="col-span-1">
                        <label className="block text-[10px] text-slate-500 font-medium mb-1">{label}</label>
                        <input
                          type={type}
                          value={edits[field] ?? ""}
                          onChange={(e) => setPlanEdits((p: any) => ({
                            ...p,
                            [plan.id]: { ...p[plan.id], [field]: type === "number" ? Number(e.target.value) : e.target.value }
                          }))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Stripe Price ID status */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${plan.stripe_price_id ? "bg-emerald-500" : "bg-amber-400"}`} />
                    <span className="text-xs text-slate-500">
                      {plan.stripe_price_id ? `Stripe: ${plan.stripe_price_id}` : "Stripe Price ID belum dikonfigurasi"}
                    </span>
                  </div>
                  {!plan.stripe_price_id && (
                    <button
                      onClick={() => createStripePrice(plan.tier)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Auto-Create Stripe Price
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{users.length} users registered</p>
            <button onClick={loadUsers} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          {usersLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : users.map((u) => (
            <div key={u.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.email}`} className="w-9 h-9 rounded-full border border-slate-200 object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{u.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0">
                {u.subscription ? (
                  <>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${TIER_COLORS[u.subscription.plan_tier]}`}>
                      {u.subscription.plan_name}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {u.subscription.posts_used}/{u.subscription.posts_limit} posts · {u.subscription.status}
                    </p>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-400">No subscription</span>
                )}
                {u.is_admin && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                    <Shield className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
            </div>
          ))}
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
                  <h3 className="text-base font-bold font-['Outfit'] text-white">Instagram Competitor Spy (Instagrapi Cookie)</h3>
                  <p className="text-xs text-pink-200">Cookie / Session Token Instagram Admin untuk mengambil data &amp; postingan profil kompetitor</p>
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
              <p className="font-semibold text-pink-200">💡 Cara Mendapatkan Instagram Session Cookie:</p>
              <ol className="list-decimal list-inside text-[11px] text-pink-300/90 space-y-0.5">
                <li>Buka <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="underline text-pink-200">instagram.com</a> dan pastikan sudah login akun admin/toko.</li>
                <li>Tekan <kbd className="px-1 bg-white/10 rounded">F12</kbd> &rarr; tab <strong>Application / Storage</strong> &rarr; <strong>Cookies</strong>.</li>
                <li>Cari cookie bernama <code className="bg-pink-950/80 px-1 py-0.5 rounded font-mono text-pink-200">sessionid</code>, lalu salin nilainya (contoh: <code>54321234%3AFakE...</code>).</li>
              </ol>
            </div>

            {/* Input field */}
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-2">
              <div>
                <label className="text-xs font-semibold text-white block">INSTAGRAM_SESSION_COOKIE (sessionid)</label>
                <p className="text-[10px] text-pink-300">Wajib untuk menjalankan fitur Competitor Spy</p>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  defaultValue={appSettings["INSTAGRAM_SESSION_COOKIE"] || ""}
                  id="setting-INSTAGRAM_SESSION_COOKIE"
                  placeholder="Masukkan sessionid Instagram..."
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
              { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", hint: "sk_test_... (sandbox)" },
              { key: "STRIPE_PUBLISHABLE_KEY", label: "Stripe Publishable Key", hint: "pk_test_... (sandbox)" },
              { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe Webhook Secret", hint: "whsec_..." },
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
