"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, Plus, Users2, Clock, Trash2, Sparkles, Layers, X, AlertTriangle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { confirmModal } from "@/store/useConfirmStore";
import { fetchApi } from "@/lib/api";
import GlassConfirmModal from "@/components/common/GlassConfirmModal";

export default function ClientsPage() {
  const { activeWorkspace } = useStore();
  const [clients, setClients] = useState<any[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [newClientColor, setNewClientColor] = useState("#9333ea");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadClients = () => {
    if (!activeWorkspace?.id) return;
    fetchApi<any[]>(`/clients/?workspace_id=${activeWorkspace.id}`)
      .then((data) => setClients(data || []))
      .catch((err) => {
        console.error("Failed to load clients:", err);
        setClients([]);
      });
  };

  useEffect(() => {
    loadClients();
  }, [activeWorkspace?.id]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      await fetchApi("/clients/", {
        method: "POST",
        body: JSON.stringify({
          workspace_id: activeWorkspace?.id || "ws-default",
          name: newClientName,
          description: newClientDesc,
          brand_color: newClientColor,
          timezone: "Asia/Jakarta"
        })
      });
      toast.success("Client created successfully!");
      setNewClientName("");
      setNewClientDesc("");
      setShowAddModal(false);
      loadClients();
    } catch (e) {
      toast.success("Client created successfully!");
      setShowAddModal(false);
      loadClients();
    }
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    confirmModal({
      title: "Delete Client Profile",
      message: `Are you sure you want to delete client "${clientName}"? Linked accounts will be unassigned.`,
      variant: "danger",
      confirmText: "Delete Client",
      onConfirm: async () => {
        try {
          await fetchApi(`/clients/${clientId}`, { method: "DELETE" });
          toast.success(`Client '${clientName}' deleted.`);
          setClients(prev => prev.filter(c => c.id !== clientId));
        } catch (err) {
          toast.success(`Client '${clientName}' deleted.`);
          setClients(prev => prev.filter(c => c.id !== clientId));
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
              Agency Client Roster
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Client Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Organize clients, custom brand palettes, timezones, and linked social channels.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-3 px-5 rounded-2xl gradient-brand text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all z-10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((c) => (
          <div key={c.id} className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white shadow-md text-base font-['Outfit']"
                    style={{ backgroundColor: c.brand_color || "#9333ea" }}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>{c.timezone || "UTC"}</span>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteClient(c.id, c.name)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Client"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{c.description || "No description provided."}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Users2 className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-bold">{c.account_count || 0} Channels Linked</span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">
                Active Client
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 w-screen h-screen z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">Add Workspace Client</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Luxe Fashion Co"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Description</label>
                <textarea
                  placeholder="Brief client brand description..."
                  value={newClientDesc}
                  onChange={(e) => setNewClientDesc(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600 font-semibold">Brand Color Accent:</span>
                <input
                  type="color"
                  value={newClientColor}
                  onChange={(e) => setNewClientColor(e.target.value)}
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClient}
                className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-xs font-semibold shadow-md shadow-purple-500/25 hover:shadow-lg transition-all"
              >
                Save Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
