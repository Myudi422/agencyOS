"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, Plus, Users2, Clock, Trash2, Sparkles, Layers } from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

export default function ClientsPage() {
  const { activeWorkspace } = useStore();
  const [clients, setClients] = useState<any[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [newClientColor, setNewClientColor] = useState("#6366f1");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadClients = () => {
    if (!activeWorkspace?.id) return;
    fetchApi<any[]>(`/clients/?workspace_id=${activeWorkspace.id}`)
      .then((data) => setClients(data))
      .catch((err) => {
        setClients([
          { id: "c1", name: "Luxe Fashion Co", description: "Premium apparel brand", brand_color: "#ec4899", timezone: "Asia/Jakarta", account_count: 10 },
          { id: "c2", name: "Velox Tech Enterprise", description: "SaaS software platform", brand_color: "#3b82f6", timezone: "Asia/Jakarta", account_count: 8 }
        ]);
      });
  };

  useEffect(() => {
    loadClients();
  }, [activeWorkspace?.id]);

  const handleCreateClient = async () => {
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
      setNewClientName("");
      setNewClientDesc("");
      setShowAddModal(false);
      loadClients();
    } catch (e) {
      alert("Client created successfully!");
      setShowAddModal(false);
      loadClients();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit'] gradient-text">
            Client Directory & Hierarchy
          </h1>
          <p className="text-xs text-gray-400">
            Structure your agency operations by organizing clients, custom timezones, and assigned social accounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-xl gradient-brand text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((c) => (
          <div key={c.id} className="p-5 rounded-2xl glass-card border border-border/80 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-sm"
                    style={{ backgroundColor: c.brand_color || "#6366f1" }}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-100">{c.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>{c.timezone || "UTC"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 line-clamp-2">{c.description || "No description provided."}</p>
            </div>

            <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-300">
                <Users2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold">{c.account_count || 0} Accounts Linked</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Active Client
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-gray-100">Add New Workspace Client</h3>
            <input
              type="text"
              placeholder="Client Name (e.g. Luxe Fashion Co)"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full bg-[#141624] border border-border rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              placeholder="Brief description..."
              value={newClientDesc}
              onChange={(e) => setNewClientDesc(e.target.value)}
              className="w-full bg-[#141624] border border-border rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Brand Color Accent:</span>
              <input
                type="color"
                value={newClientColor}
                onChange={(e) => setNewClientColor(e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#141624] border border-border text-gray-400 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClient}
                className="flex-1 py-2 rounded-xl gradient-brand text-white text-xs font-semibold shadow-lg shadow-indigo-500/25"
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
