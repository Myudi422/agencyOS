"use client";

import React from "react";
import { TrendingUp, DollarSign, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

interface RoiSummaryProps {
  summary: {
    campaign_id: string;
    campaign_name: string;
    total_budget: number;
    total_agreed_rate: number;
    total_paid_amount: number;
    unpaid_remaining: number;
    estimated_revenue: number;
    roi_percentage: number;
    completion_rate: number;
    total_kols: number;
    deliverables_summary: {
      pending: number;
      submitted: number;
      approved: number;
      revision_requested: number;
      rejected: number;
      total: number;
    };
  };
}

export default function CampaignRoiCard({ summary }: RoiSummaryProps) {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const isPositiveRoi = summary.roi_percentage >= 0;
  const ds = summary.deliverables_summary;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          📊 ROI &amp; Financial Summary
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-2xl font-black ${isPositiveRoi ? "text-emerald-600" : "text-red-600"}`}>
            {isPositiveRoi ? `+${summary.roi_percentage}%` : `${summary.roi_percentage}%`}
          </span>
          <span className="text-xs font-semibold text-slate-500">Estimasi ROI</span>
        </div>
      </div>

      {/* Financial Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Total Budget</span>
          <span className="font-bold text-slate-800">{formatRupiah(summary.total_budget)}</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Agreed Rates (KOL)</span>
          <span className="font-bold text-purple-700">{formatRupiah(summary.total_agreed_rate)}</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Sudah Dibayar (Paid)</span>
          <span className="font-bold text-emerald-600">{formatRupiah(summary.total_paid_amount)}</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Sisa Belum Dibayar</span>
          <span className="font-bold text-amber-600">{formatRupiah(summary.unpaid_remaining)}</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1.5 font-semibold bg-purple-50 p-2 rounded-xl text-purple-950">
          <span>Target Revenue</span>
          <span className="font-extrabold">{formatRupiah(summary.estimated_revenue)}</span>
        </div>
      </div>

      {/* Deliverable Progress */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold text-slate-800">Progres Deliverables</span>
          <span className="font-mono font-bold text-purple-700">{summary.completion_rate}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-3">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${summary.completion_rate}%` }}
          />
        </div>

        {/* Breakdown chips */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-semibold">{ds.approved} Approved</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">{ds.submitted} Submitted</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{ds.pending} Pending</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-semibold">{ds.revision_requested} Revisi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
