"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CampaignRoiCard from "@/components/kol/CampaignRoiCard";
import KolAddToCampaignModal from "@/components/kol/KolAddToCampaignModal";
import DeliverableAddModal from "@/components/kol/DeliverableAddModal";
import CampaignCreateModal from "@/components/kol/CampaignCreateModal";
import { fetchApi } from "@/lib/api";
import { useStore } from "@/store/useStore";
import {
  ArrowLeft, Plus, CheckCircle2, Clock, AlertTriangle, Trash2, Edit, ExternalLink,
  DollarSign, Hash, Calendar, RefreshCw, UserMinus, ShieldAlert
} from "lucide-react";

const DELIVERABLE_STATUS_COLORS: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-slate-100", text: "text-slate-600" },
  submitted: { label: "Submitted", bg: "bg-blue-100", text: "text-blue-700" },
  approved: { label: "Approved ✅", bg: "bg-emerald-100", text: "text-emerald-800" },
  revision_requested: { label: "Revisi ⚠️", bg: "bg-amber-100", text: "text-amber-800" },
  rejected: { label: "Rejected ❌", bg: "bg-red-100", text: "text-red-800" },
};

const PAYMENT_STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  unpaid: { label: "Unpaid", bg: "bg-red-50", text: "text-red-700" },
  partial: { label: "Partial", bg: "bg-amber-50", text: "text-amber-700" },
  paid: { label: "Paid ✓", bg: "bg-emerald-50", text: "text-emerald-700" },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const { activeWorkspace } = useStore();

  const [campaign, setCampaign] = useState<any | null>(null);
  const [roiData, setRoiData] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddKolOpen, setIsAddKolOpen] = useState(false);
  const [isAddDeliverableOpen, setIsAddDeliverableOpen] = useState(false);
  const [selectedCkolId, setSelectedCkolId] = useState("");
  const [deliverableToEdit, setDeliverableToEdit] = useState<any | null>(null);
  const [isEditCampaignOpen, setIsEditCampaignOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [cmpRes, roiRes, accRes] = await Promise.all([
        fetchApi<any>(`/kol/campaigns/${campaignId}`),
        fetchApi<any>(`/kol/campaigns/${campaignId}/roi`),
        fetchApi<any>("/kol/platform-accounts"),
      ]);
      setCampaign(cmpRes);
      setRoiData(roiRes);
      setAccounts(accRes.accounts || []);
    } catch (err) {
      console.error("Gagal mengambil detail campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId && activeWorkspace) {
      fetchDetail();
    }
  }, [campaignId, activeWorkspace]);

  const handleUpdateDeliverableStatus = async (deliverableId: string, newStatus: string) => {
    try {
      await fetchApi(`/kol/deliverables/${deliverableId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDetail();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status deliverable.");
    }
  };

  const handleDeleteDeliverable = async (id: string, title: string) => {
    if (!confirm(`Hapus deliverable '${title}'?`)) return;
    try {
      await fetchApi(`/kol/deliverables/${id}`, { method: "DELETE" });
      fetchDetail();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus deliverable.");
    }
  };

  const handleRemoveKolFromCampaign = async (ckolId: string, username: string) => {
    if (!confirm(`Hapus KOL @${username} dari campaign ini?`)) return;
    try {
      await fetchApi(`/kol/campaigns/${campaignId}/kols/${ckolId}`, { method: "DELETE" });
      fetchDetail();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus KOL dari campaign.");
    }
  };

  const handleUpdatePaymentStatus = async (ckolId: string, currentRate: number, currentPaid: number, nextStatus: string) => {
    let paidAmt = currentPaid;
    if (nextStatus === "paid") paidAmt = currentRate;
    if (nextStatus === "unpaid") paidAmt = 0;

    try {
      await fetchApi(`/kol/campaigns/${campaignId}/kols/${ckolId}`, {
        method: "PUT",
        body: JSON.stringify({ payment_status: nextStatus, paid_amount: paidAmt }),
      });
      fetchDetail();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status pembayaran.");
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="h-20 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-96 bg-slate-100 rounded-3xl animate-pulse col-span-1" />
          <div className="h-96 bg-slate-100 rounded-3xl animate-pulse col-span-2" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-bold text-slate-700">Campaign tidak ditemukan.</p>
        <Link href="/kol-campaigns" className="text-xs text-purple-600 underline mt-2 inline-block">
          Kembali ke KOL Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/kol-campaigns"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke KOL Campaigns</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditCampaignOpen(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Campaign</span>
              </button>
              <button
                onClick={() => setIsAddKolOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah KOL</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  {campaign.status}
                </span>
                {campaign.social_account && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    @{campaign.social_account.username} ({campaign.social_account.platform})
                  </span>
                )}
                {campaign.hashtag_mandatory && (
                  <span className="text-xs font-mono font-bold text-purple-700 flex items-center gap-0.5">
                    <Hash className="w-3 h-3" />
                    {campaign.hashtag_mandatory}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-black text-slate-900">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">{campaign.description}</p>
              )}
            </div>

            {campaign.campaign_brief_url && (
              <a
                href={campaign.campaign_brief_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                <span>Buka Brief Campaign</span>
              </a>
            )}
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left Column: ROI & Financial Summary Card */}
          <div className="md:col-span-1">
            {roiData && <CampaignRoiCard summary={roiData} />}
          </div>

          {/* Right Column: KOL List & Deliverable Tracker */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Daftar KOL ({campaign.kols.length})</span>
              </h3>
              <button
                onClick={() => setIsAddKolOpen(true)}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah KOL</span>
              </button>
            </div>

            {campaign.kols.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                <p className="text-xs font-bold text-slate-700 mb-1">Belum ada KOL di campaign ini</p>
                <p className="text-xs text-slate-500 mb-4">Klik tombol "+ Tambah KOL" untuk memilih influencer dari database master.</p>
                <button
                  onClick={() => setIsAddKolOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
                >
                  + Tambah KOL
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaign.kols.map((ckol: any) => {
                  const kolProf = ckol.kol_profile;
                  const payBadge = PAYMENT_STATUS_BADGES[ckol.payment_status] || PAYMENT_STATUS_BADGES.unpaid;

                  return (
                    <div key={ckol.ckol_id} className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                      {/* KOL Info Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          {kolProf?.profile_pic_url ? (
                            <img src={kolProf.profile_pic_url} className="w-10 h-10 rounded-2xl object-cover border border-slate-200" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                              {kolProf?.username?.charAt(0).toUpperCase() || "K"}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-extrabold text-slate-900">{kolProf?.name}</h4>
                              <span className="text-xs font-bold text-purple-700">@{kolProf?.username}</span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                                {kolProf?.tier}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span>Agreed Rate: <strong className="text-slate-800">{formatRupiah(ckol.agreed_rate)}</strong></span>
                              <span>WA: <strong className="text-slate-800">{kolProf?.contact_wa || "-"}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Dropdown & Actions */}
                        <div className="flex items-center gap-2">
                          <select
                            value={ckol.payment_status}
                            onChange={(e) => handleUpdatePaymentStatus(ckol.ckol_id, ckol.agreed_rate, ckol.paid_amount, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${payBadge.bg} ${payBadge.text} cursor-pointer focus:outline-none`}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid ✓</option>
                          </select>

                          <button
                            onClick={() => handleRemoveKolFromCampaign(ckol.ckol_id, kolProf?.username || "")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus KOL dari campaign"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Deliverables Checklist Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Deliverables Konten ({ckol.deliverables.length})
                          </h5>
                          <button
                            onClick={() => {
                              setSelectedCkolId(ckol.ckol_id);
                              setDeliverableToEdit(null);
                              setIsAddDeliverableOpen(true);
                            }}
                            className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah Deliverable</span>
                          </button>
                        </div>

                        {ckol.deliverables.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                            Belum ada deliverable untuk KOL ini. Klik "+ Tambah Deliverable".
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {ckol.deliverables.map((d: any) => {
                              const stBadge = DELIVERABLE_STATUS_COLORS[d.status] || DELIVERABLE_STATUS_COLORS.pending;
                              return (
                                <div
                                  key={d.id}
                                  className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-all"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5">
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-purple-100 text-purple-800">
                                        {d.deliverable_type}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-800">{d.title}</p>
                                      {d.due_date && (
                                        <p className="text-[10px] text-slate-400 font-medium">Due: {d.due_date}</p>
                                      )}
                                      {d.content_url && (
                                        <a
                                          href={d.content_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[11px] font-semibold text-purple-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                                        >
                                          <span>Link Konten</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status Selector & Actions */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <select
                                      value={d.status}
                                      onChange={(e) => handleUpdateDeliverableStatus(d.id, e.target.value)}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${stBadge.bg} ${stBadge.text} cursor-pointer focus:outline-none`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="submitted">Submitted</option>
                                      <option value="approved">Approved ✅</option>
                                      <option value="revision_requested">Revisi ⚠️</option>
                                      <option value="rejected">Rejected ❌</option>
                                    </select>

                                    <button
                                      onClick={() => {
                                        setSelectedCkolId(ckol.ckol_id);
                                        setDeliverableToEdit(d);
                                        setIsAddDeliverableOpen(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-purple-600"
                                      title="Edit"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteDeliverable(d.id, d.title)}
                                      className="p-1 text-slate-400 hover:text-red-600"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add KOL Modal */}
      <KolAddToCampaignModal
        isOpen={isAddKolOpen}
        onClose={() => setIsAddKolOpen(false)}
        onSuccess={() => fetchDetail()}
        campaignId={campaignId}
      />

      {/* Add/Edit Deliverable Modal */}
      <DeliverableAddModal
        isOpen={isAddDeliverableOpen}
        onClose={() => setIsAddDeliverableOpen(false)}
        onSuccess={() => fetchDetail()}
        campaignKolId={selectedCkolId}
        deliverableToEdit={deliverableToEdit}
      />

      {/* Edit Campaign Modal */}
      <CampaignCreateModal
        isOpen={isEditCampaignOpen}
        onClose={() => setIsEditCampaignOpen(false)}
        onSuccess={() => fetchDetail()}
        accounts={accounts}
        campaignToEdit={campaign}
      />
    </div>
  );
}
