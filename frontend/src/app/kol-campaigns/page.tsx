"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import KolAccountSelector, { AccountItem } from "@/components/kol/KolAccountSelector";
import CampaignCard, { CampaignItem } from "@/components/kol/CampaignCard";
import CampaignCreateModal from "@/components/kol/CampaignCreateModal";
import KolDatabaseDrawer from "@/components/kol/KolDatabaseDrawer";
import { fetchApi } from "@/lib/api";
import { useStore } from "@/store/useStore";
import {
  Sparkles, Plus, Users, Search, RefreshCw, AlertCircle, Filter, FolderKanban
} from "lucide-react";

export default function KolCampaignsPage() {
  const { activeWorkspace } = useStore();

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDatabaseDrawerOpen, setIsDatabaseDrawerOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<CampaignItem | null>(null);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetchApi<any>("/kol/platform-accounts");
      setAccounts(res.accounts || []);
    } catch (err) {
      console.error("Gagal mengambil akun platform:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedAccountId) queryParams.set("social_account_id", selectedAccountId);
      if (statusFilter) queryParams.set("status", statusFilter);

      const res = await fetchApi<any>(`/kol/campaigns?${queryParams.toString()}`);
      setCampaigns(res.campaigns || []);
    } catch (err) {
      console.error("Gagal mengambil data campaigns:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchAccounts();
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeWorkspace) {
      fetchCampaigns();
    }
  }, [activeWorkspace, selectedAccountId, statusFilter]);

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus campaign ini? Semua deliverables & data KOL di campaign ini akan terhapus.")) return;
    try {
      await fetchApi(`/kol/campaigns/${id}`, { method: "DELETE" });
      fetchCampaigns();
      fetchAccounts();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus campaign.");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/25">
                🤝
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                KOL Campaign &amp; Deliverable Tracker
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] uppercase border border-purple-200">
                Zero Budget Leak
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kelola kampanye influencer per akun platform, lacak progress deliverable, dan hitung ROI otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsDatabaseDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Master KOL Database</span>
            </button>

            <button
              onClick={() => { setCampaignToEdit(null); setIsCreateModalOpen(true); }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Campaign</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left Column: Platform Account Selector */}
          <div className="md:col-span-1">
            <KolAccountSelector
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccount={(id) => setSelectedAccountId(id)}
              loading={loadingAccounts}
            />
          </div>

          {/* Right Column: Campaign Cards List */}
          <div className="md:col-span-2 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Filter Status:
                </span>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { key: "", label: "Semua" },
                    { key: "draft", label: "Draft" },
                    { key: "active", label: "Aktif" },
                    { key: "completed", label: "Selesai" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        statusFilter === f.key
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => fetchCampaigns()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Campaign Cards Grid */}
            {loadingCampaigns ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-extrabold text-slate-800 mb-1">
                  Belum ada Campaign KOL
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  {selectedAccountId
                    ? "Belum ada kampanye KOL untuk akun platform yang dipilih."
                    : "Mulai buat kampanye pertama Anda untuk melacak influencer dan ROI."}
                </p>
                <button
                  onClick={() => { setCampaignToEdit(null); setIsCreateModalOpen(true); }}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Campaign Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {campaigns.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onEdit={(cmp) => { setCampaignToEdit(cmp); setIsCreateModalOpen(true); }}
                    onDelete={(id) => handleDeleteCampaign(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Create/Edit Modal */}
      <CampaignCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { fetchCampaigns(); fetchAccounts(); }}
        accounts={accounts}
        defaultSocialAccountId={selectedAccountId}
        campaignToEdit={campaignToEdit}
      />

      {/* KOL Master Database Drawer */}
      <KolDatabaseDrawer
        isOpen={isDatabaseDrawerOpen}
        onClose={() => setIsDatabaseDrawerOpen(false)}
      />
    </AppLayout>
  );
}
