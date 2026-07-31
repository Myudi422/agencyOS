"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, CheckSquare } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface DeliverableAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaignKolId: string;
  deliverableToEdit?: any | null;
}

export default function DeliverableAddModal({
  isOpen,
  onClose,
  onSuccess,
  campaignKolId,
  deliverableToEdit,
}: DeliverableAddModalProps) {
  const [deliverableType, setDeliverableType] = useState("ig_reels");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (deliverableToEdit) {
      setDeliverableType(deliverableToEdit.deliverable_type || "ig_reels");
      setTitle(deliverableToEdit.title || "");
      setStatus(deliverableToEdit.status || "pending");
      setDueDate(deliverableToEdit.due_date || "");
      setContentUrl(deliverableToEdit.content_url || "");
      setReviewNotes(deliverableToEdit.review_notes || "");
    } else {
      setDeliverableType("ig_reels");
      setTitle("");
      setStatus("pending");
      setDueDate("");
      setContentUrl("");
      setReviewNotes("");
    }
    setError("");
  }, [deliverableToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Judul deliverable wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      campaign_kol_id: campaignKolId,
      deliverable_type: deliverableType,
      title: title.trim(),
      status,
      due_date: dueDate || null,
      content_url: contentUrl.trim() || null,
      review_notes: reviewNotes.trim() || null,
    };

    try {
      if (deliverableToEdit) {
        await fetchApi(`/kol/deliverables/${deliverableToEdit.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/kol/deliverables", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan deliverable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {deliverableToEdit ? "Edit Deliverable" : "Tambah Deliverable Konten"}
            </h3>
            <p className="text-[11px] text-slate-500">Item konten yang wajib dibuat oleh KOL</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Type & Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Konten</label>
            <select
              value={deliverableType}
              onChange={(e) => setDeliverableType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ig_reels">Instagram Reels</option>
              <option value="ig_post">Instagram Feed Post</option>
              <option value="ig_story">Instagram Story</option>
              <option value="tiktok_video">TikTok Video</option>
              <option value="youtube_video">YouTube Dedicated Video</option>
              <option value="youtube_short">YouTube Short</option>
              <option value="twitter_post">X (Twitter) Thread/Post</option>
              <option value="linkedin_post">LinkedIn Post</option>
              <option value="blog_post">Blog Article</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul Deliverable <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="1x Reels Review Soft Launch Produk A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Status & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Konten</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="pending">Pending (Belum)</option>
                <option value="submitted">Submitted (Sudah Tayang)</option>
                <option value="approved">Approved (Disetujui ✅)</option>
                <option value="revision_requested">Revisi Diminta ⚠️</option>
                <option value="rejected">Rejected (Ditolak ❌)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Deadline (Due Date)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Content URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Link Konten (TikTok / IG Reel URL)</label>
            <input
              type="url"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Review Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Review / Revisi</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Catatan dari agency untuk KOL..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{deliverableToEdit ? "Simpan Perubahan" : "Tambah Deliverable"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
