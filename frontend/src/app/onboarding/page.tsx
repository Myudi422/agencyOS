"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Sparkles, ArrowRight, ShieldCheck, Layers, Globe } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setWorkspaceId, setNeedsOnboarding } = useAuthStore();
  const { setWorkspaces, setActiveWorkspace } = useStore();

  const [workspaceName, setWorkspaceName] = useState(
    user?.full_name ? `${user.full_name.split(" ")[0]}'s Agency` : "My Workspace"
  );
  const [agencyType, setAgencyType] = useState("agency");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [firstClientName, setFirstClientName] = useState("Primary Client");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error("Nama workspace tidak boleh kosong!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchApi<any>("/workspaces/setup", {
        method: "POST",
        body: JSON.stringify({
          workspace_name: workspaceName.trim(),
          agency_type: agencyType,
          timezone,
          first_client_name: firstClientName.trim() || "Primary Client",
        }),
      });

      if (res.workspace) {
        setWorkspaceId(res.workspace.id);
        setNeedsOnboarding(false);
        const wsObj = {
          id: res.workspace.id,
          name: res.workspace.name,
          slug: res.workspace.slug,
          timezone: res.workspace.timezone || timezone,
        };
        setWorkspaces([wsObj]);
        setActiveWorkspace(wsObj);

        toast.success(`Workspace ${res.workspace.name} berhasil dibuat!`);
        router.replace("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat workspace. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Selamat Datang di AgencyOS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Outfit'] bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
            Buat Workspace Pertama Anda
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Untuk keamanan dan isolasi akun, semua sosial media, klien, dan statistik Anda akan dikelola dalam workspace pribadi Anda.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Workspace Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                Nama Workspace / Agency
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Contoh: Digital Brand Studio"
                required
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>

            {/* Agency Type & Timezone in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Tipe Tim
                </label>
                <select
                  value={agencyType}
                  onChange={(e) => setAgencyType(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-slate-300 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="agency">Agency / Studio</option>
                  <option value="freelancer">Freelancer / Creator</option>
                  <option value="brand">In-house Brand</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Zona Waktu
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-slate-300 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                  <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                  <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                  <option value="UTC">UTC (Universal)</option>
                </select>
              </div>
            </div>

            {/* First Client Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Nama Klien Utama (Opsional)
              </label>
              <input
                type="text"
                value={firstClientName}
                onChange={(e) => setFirstClientName(e.target.value)}
                placeholder="Contoh: Primary Client / Internal Project"
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Workspace...</span>
                </>
              ) : (
                <>
                  <span>Buat Workspace & Masuk Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security badge note */}
        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Data sosial akun Anda diisolasi khusus untuk workspace ini.
        </p>
      </div>
    </div>
  );
}
