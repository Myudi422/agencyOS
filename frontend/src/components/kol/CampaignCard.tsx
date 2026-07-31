"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar, DollarSign, TrendingUp, Users, CheckCircle, Edit, Trash2, ChevronRight, Hash
} from "lucide-react";

export interface CampaignItem {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "completed" | "paused" | "cancelled";
  start_date?: string;
  end_date?: string;
  total_budget: number;
  total_agreed_rate: number;
  total_paid_amount: number;
  estimated_revenue?: number;
  roi_percentage: number;
  campaign_brief_url?: string;
  hashtag_mandatory?: string;
  total_kols: number;
  kol_avatars: string[];
  social_account?: {
    id: string;
    username: string;
    name: string;
    platform: string;
    avatar_url?: string;
  };
  deliverables_summary: {
    total: number;
    approved: number;
    completion_rate: number;
  };
}

interface CampaignCardProps {
  campaign: CampaignItem;
  onEdit?: (campaign: CampaignItem) => void;
  onDelete?: (id: string) => void;
}

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: "Draft", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  active: { label: "Aktif", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  completed: { label: "Selesai", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  paused: { label: "Ditunda", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  cancelled: { label: "Dibatalkan", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
};

export default function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  const statusConfig = STATUS_BADGES[campaign.status] || STATUS_BADGES.draft;
  const isPositiveRoi = campaign.roi_percentage >= 0;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Header: Name + Status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                {statusConfig.label}
              </span>
              {campaign.social_account && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  @{campaign.social_account.username}
                </span>
              )}
            </div>
            <h4 className="text-base font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
              {campaign.name}
            </h4>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => { e.preventDefault(); onEdit(campaign); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                title="Edit Campaign"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); onDelete(campaign.id); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Hapus Campaign"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {campaign.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {campaign.description}
          </p>
        )}

        {campaign.hashtag_mandatory && (
          <div className="flex items-center gap-1 text-[11px] text-purple-700 font-mono font-medium mb-3">
            <Hash className="w-3 h-3 text-purple-500" />
            <span>{campaign.hashtag_mandatory}</span>
          </div>
        )}

        {/* Financials & ROI */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Total Budget</span>
            <span className="text-xs font-bold text-slate-800">{formatRupiah(campaign.total_budget)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Estimasi ROI</span>
            <span className={`text-xs font-extrabold flex items-center gap-0.5 ${isPositiveRoi ? "text-emerald-600" : "text-red-600"}`}>
              <TrendingUp className="w-3 h-3" />
              {isPositiveRoi ? `+${campaign.roi_percentage}%` : `${campaign.roi_percentage}%`}
            </span>
          </div>
        </div>

        {/* Deliverable Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
              Deliverables Approved
            </span>
            <span className="font-mono font-bold text-slate-700">
              {campaign.deliverables_summary.approved} / {campaign.deliverables_summary.total} ({campaign.deliverables_summary.completion_rate}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${campaign.deliverables_summary.completion_rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Avatar Stack & CTA */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            {campaign.kol_avatars.length > 0 ? (
              campaign.kol_avatars.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  alt=""
                />
              ))
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 ring-2 ring-white">
                0
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {campaign.total_kols} KOL
          </span>
        </div>

        <Link
          href={`/kol-campaigns/${campaign.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 group-hover:translate-x-0.5 transition-all"
        >
          <span>Detail Campaign</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
