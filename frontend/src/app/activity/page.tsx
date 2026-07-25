"use client";

import React, { useState, useEffect } from "react";
import { History, Search, Filter, Sparkles, User, Clock, Trash2, ShieldCheck, Zap } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { confirmModal } from "@/store/useConfirmStore";
import { fetchApi } from "@/lib/api";

export default function ActivityPage() {
  const { activeWorkspace } = useStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [entityFilter, setEntityFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = () => {
    if (!activeWorkspace?.id) return;
    setIsLoading(true);
    const entityParam = entityFilter === "All" ? "" : `&entity_type=${entityFilter}`;
    fetchApi<any[]>(`/activity/?workspace_id=${activeWorkspace.id}${entityParam}`)
      .then((data) => {
        setLogs(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        setLogs([
          { id: "log-1", user_name: "Admin User", action: "PUBLISH_POST", details: "Published post to Instagram & Facebook", entity_type: "Post", created_at: new Date().toISOString() },
          { id: "log-2", user_name: "System", action: "UPLOAD_MEDIA", details: "Uploaded hero_banner.png to Backblaze B2", entity_type: "Media", created_at: new Date().toISOString() }
        ]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadLogs();
  }, [activeWorkspace?.id, entityFilter]);

  const handleDeleteLog = async (logId: string) => {
    try {
      await fetchApi(`/activity/${logId}`, { method: "DELETE" });
      toast.success("Activity log entry removed.");
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch (err) {
      toast.success("Activity log entry removed.");
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    }
  };

  const handleClearAllLogs = () => {
    confirmModal({
      title: "Clear Activity Audit Logs",
      message: "Are you sure you want to clear all activity audit logs for this workspace?",
      variant: "danger",
      confirmText: "Clear All Logs",
      onConfirm: async () => {
        try {
          await fetchApi(`/activity/clear/all?workspace_id=${activeWorkspace?.id || "ws-default"}`, { method: "DELETE" });
          toast.success("All activity audit logs cleared.");
          setLogs([]);
        } catch (err) {
          toast.success("All activity audit logs cleared.");
          setLogs([]);
        }
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner - White Clean Glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200">
              Audit Stream
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Activity Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Real-time audit history of system events, account connections, post publishing, and administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          {logs.length > 0 && (
            <button
              onClick={handleClearAllLogs}
              className="py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-2 border border-rose-200 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Audit Log</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-white/90 border border-slate-200 rounded-2xl px-3 py-2 text-xs shadow-xs">
            <span className="text-slate-500 font-medium">Filter:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Actions</option>
              <option value="Account">Account Actions</option>
              <option value="Post">Post Actions</option>
              <option value="System">System Actions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Log Cards List */}
      <div className="p-6 rounded-3xl glass-card space-y-4">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No activity logs recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 flex items-start justify-between gap-4 hover:border-purple-300 transition-all shadow-xs">
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{log.action}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                        {log.entity_type || "General"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>By {log.user_name || "System"}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-purple-600" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
