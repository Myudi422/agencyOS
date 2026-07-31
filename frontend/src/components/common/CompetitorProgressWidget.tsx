"use client";

import React, { useEffect } from "react";
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { useCompetitorSpyStore } from "@/store/useCompetitorSpyStore";
import { fetchApi } from "@/lib/api";
import { toast } from "@/store/useToastStore";

export default function CompetitorProgressWidget() {
  const {
    activeAddJob,
    activeSyncAllJob,
    setAddJob,
    setSyncAllJob,
    clearAddJob,
    clearSyncAllJob,
  } = useCompetitorSpyStore();

  // Poll activeAddJob status
  useEffect(() => {
    if (!activeAddJob || activeAddJob.status !== "running") return;

    const interval = setInterval(async () => {
      try {
        const res: any = await fetchApi(`/competitors/add-status/${activeAddJob.jobId}`);
        if (res) {
          if (res.status === "done" || res.percent >= 100) {
            setAddJob({
              ...activeAddJob,
              percent: 100,
              message: res.message || "Kompetitor berhasil ditambahkan! (Versi Terbaru)",
              status: "done",
            });
            toast.success(res.message || `Kompetitor @${activeAddJob.username} berhasil ditambahkan! Data versi terbaru.`);
            setTimeout(() => {
              clearAddJob();
            }, 3500);
          } else {
            setAddJob({
              ...activeAddJob,
              percent: res.percent || activeAddJob.percent,
              message: res.message || activeAddJob.message,
              status: "running",
            });
          }
        }
      } catch (e) {
        console.error("Error polling add job status:", e);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeAddJob, setAddJob, clearAddJob]);

  // Poll activeSyncAllJob status
  useEffect(() => {
    if (!activeSyncAllJob || !activeSyncAllJob.running) return;

    const interval = setInterval(async () => {
      try {
        const res: any = await fetchApi("/competitors/sync-status");
        if (res) {
          if (!res.running) {
            setSyncAllJob({
              ...activeSyncAllJob,
              running: false,
              done: res.done || activeSyncAllJob.total,
              percent: 100,
              message: res.message || "Sync All selesai! Data dalam versi terbaru.",
              errors: res.errors || [],
            });
            toast.success("Sync All selesai! Seluruh data kompetitor telah diperbarui ke versi terbaru.");
            setTimeout(() => {
              clearSyncAllJob();
            }, 3500);
          } else {
            setSyncAllJob({
              ...activeSyncAllJob,
              running: true,
              done: res.done || 0,
              total: res.total || activeSyncAllJob.total,
              percent: res.percent || 0,
              message: res.message || "Menyinkronisasi brand kompetitor...",
              errors: res.errors || [],
            });
          }
        }
      } catch (e) {
        console.error("Error polling sync-all status:", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeSyncAllJob, setSyncAllJob, clearSyncAllJob]);

  if (!activeAddJob && !activeSyncAllJob) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto animate-in fade-in slide-in-from-top-5">
      {/* ADD COMPETITOR PROGRESS */}
      {activeAddJob && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {activeAddJob.status === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-pink-400 animate-spin shrink-0" />
              )}
              <p className="text-xs font-bold truncate">@{activeAddJob.username}</p>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
              {activeAddJob.percent}%
            </span>
          </div>

          <p className="text-[11px] text-slate-300 mb-2.5 truncate">{activeAddJob.message}</p>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                activeAddJob.status === "done"
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-purple-500 to-pink-500"
              }`}
              style={{ width: `${activeAddJob.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* SYNC ALL PROGRESS */}
      {activeSyncAllJob && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {activeSyncAllJob.running ? (
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <p className="text-xs font-bold truncate">Sync All Brands</p>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              {activeSyncAllJob.percent}%
            </span>
          </div>

          <p className="text-[11px] text-slate-300 mb-2.5 truncate">{activeSyncAllJob.message}</p>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                activeSyncAllJob.running
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${activeSyncAllJob.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
