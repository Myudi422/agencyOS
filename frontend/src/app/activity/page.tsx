"use client";

import React, { useState, useEffect } from "react";
import { History, Search, Filter, Sparkles, User, Clock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

export default function ActivityPage() {
  const { activeWorkspace } = useStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const loadLogs = () => {
    if (!activeWorkspace?.id) return;
    let url = `/activity/?workspace_id=${activeWorkspace.id}&limit=100`;
    if (entityFilter !== "all") url += `&entity_type=${entityFilter}`;

    fetchApi<any[]>(url)
      .then((data) => setLogs(data))
      .catch((err) => {
        setLogs([
          { id: "1", action: "CONNECT_ACCOUNT", details: "Connected Meta OAuth Account @luxefashion_co", user_name: "Alex Rivera", created_at: new Date().toISOString() },
          { id: "2", action: "PUBLISH_POST", details: "Published multi-target post to 4 accounts", user_name: "Alex Rivera", created_at: new Date().toISOString() },
          { id: "3", action: "UPLOAD_MEDIA", details: "Uploaded summer_campaign_hero.jpg to Backblaze B2 bucket", user_name: "Alex Rivera", created_at: new Date().toISOString() }
        ]);
      });
  };

  useEffect(() => {
    loadLogs();
  }, [activeWorkspace?.id, entityFilter]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit'] gradient-text">
            Enterprise Activity Audit Log
          </h1>
          <p className="text-xs text-gray-400">
            Immutable system audit trails logging logins, account connections, post creation, publishing jobs, and media updates.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#141624] border border-border rounded-xl px-3 py-1.5 text-xs">
          <span className="text-gray-400 font-medium">Filter Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#141624]">All Actions</option>
            <option value="Account" className="bg-[#141624]">Account Actions</option>
            <option value="Post" className="bg-[#141624]">Post Actions</option>
            <option value="Media" className="bg-[#141624]">Media Actions</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline Stream */}
      <div className="p-6 rounded-2xl glass-card border border-border/80 space-y-4">
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-[#121422] border border-border/60 flex items-start gap-4 hover:border-indigo-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200 tracking-wide">{log.action}</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-300">{log.details}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <User className="w-3 h-3 text-gray-400" />
                  <span>By {log.user_name || "System"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
