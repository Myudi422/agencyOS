import { create } from "zustand";
import { fetchApi } from "@/lib/api";

export interface AgentConfig {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  account_ids: string[];
  content_pillar: string;
  content_format: string;
  topic_hint?: string;
  drafts_per_run?: number;
  run_time: string;
  timezone: string;
  run_days: number[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  total_runs: number;
  total_drafts_generated: number;
  last_run_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgentRunLog {
  id: string;
  agent_id: string;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  trigger: "scheduled" | "manual";
  accounts_targeted: { id: string; username: string; platform: string; name: string }[];
  content_pillar: string;
  content_format: string;
  topic_hint?: string;
  drafts: AgentDraft[];
  drafts_count: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface AgentDraft {
  accounts: { id: string; username: string; platform: string }[];
  brief_text: string;
  composer_payload?: {
    caption?: string;
    hashtags?: string;
    post_type?: string;
    account_ids?: string[];
  };
  generated_at: string;
}

interface AgentStore {
  agents: AgentConfig[];
  selectedAgentId: string | null;
  logs: AgentRunLog[];
  loadingAgents: boolean;
  loadingLogs: boolean;
  runningAgentIds: Set<string>;

  // Pagination
  logsPage: number;
  logsLimit: number;
  totalLogs: number;
  totalPages: number;

  fetchAgents: (workspaceId: string) => Promise<void>;
  fetchLogs: (agentId: string, page?: number, limit?: number) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  bulkDeleteLogs: (logIds: string[]) => Promise<number>;
  selectAgent: (id: string | null) => void;
  setAgents: (agents: AgentConfig[]) => void;
  upsertAgent: (agent: AgentConfig) => void;
  removeAgent: (agentId: string) => void;
  setRunning: (agentId: string, running: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  selectedAgentId: null,
  logs: [],
  loadingAgents: false,
  loadingLogs: false,
  runningAgentIds: new Set(),

  logsPage: 1,
  logsLimit: 10,
  totalLogs: 0,
  totalPages: 1,

  fetchAgents: async (workspaceId) => {
    set({ loadingAgents: true });
    try {
      const data = await fetchApi<AgentConfig[]>(`/agents/?workspace_id=${workspaceId}`);
      set({ agents: data || [] });
    } catch (e) {
      console.error("Failed to fetch agents:", e);
    } finally {
      set({ loadingAgents: false });
    }
  },

  fetchLogs: async (agentId, page = 1, limit = 10) => {
    set({ loadingLogs: true });
    try {
      const res = await fetchApi<any>(`/agents/${agentId}/logs?page=${page}&limit=${limit}`);
      if (res && Array.isArray(res.items)) {
        set({
          logs: res.items,
          totalLogs: res.total || 0,
          logsPage: res.page || page,
          logsLimit: res.limit || limit,
          totalPages: res.total_pages || 1,
        });
      } else if (Array.isArray(res)) {
        // Fallback for array response
        set({
          logs: res,
          totalLogs: res.length,
          logsPage: 1,
          totalPages: 1,
        });
      }
    } catch (e) {
      console.error("Failed to fetch agent logs:", e);
    } finally {
      set({ loadingLogs: false });
    }
  },

  deleteLog: async (logId) => {
    try {
      const res = await fetchApi<any>(`/agents/logs/${logId}`, { method: "DELETE" });
      set((state) => ({
        logs: state.logs.filter((l) => l.id !== logId),
        totalLogs: Math.max(0, state.totalLogs - 1),
      }));

      // Update agent stats in store if returned
      if (res && res.agent) {
        get().upsertAgent(res.agent);
      }
    } catch (e) {
      console.error("Failed to delete agent log:", e);
      throw e;
    }
  },

  bulkDeleteLogs: async (logIds) => {
    try {
      const res = await fetchApi<any>(`/agents/logs/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({ log_ids: logIds }),
      });
      const deletedCount = res?.deleted_count || logIds.length;
      set((state) => ({
        logs: state.logs.filter((l) => !logIds.includes(l.id)),
        totalLogs: Math.max(0, state.totalLogs - deletedCount),
      }));

      // Update affected agents in store
      if (res && Array.isArray(res.updated_agents)) {
        res.updated_agents.forEach((ag: AgentConfig) => {
          get().upsertAgent(ag);
        });
      }
      return deletedCount;
    } catch (e) {
      console.error("Failed to bulk delete logs:", e);
      throw e;
    }
  },

  selectAgent: (id) => {
    set({ selectedAgentId: id, logs: [], logsPage: 1, totalLogs: 0, totalPages: 1 });
    if (id) get().fetchLogs(id, 1, get().logsLimit);
  },

  setAgents: (agents) => set({ agents }),

  upsertAgent: (agent) =>
    set((state) => {
      const exists = state.agents.find((a) => a.id === agent.id);
      if (exists) {
        return { agents: state.agents.map((a) => (a.id === agent.id ? agent : a)) };
      }
      return { agents: [agent, ...state.agents] };
    }),

  removeAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== agentId),
      selectedAgentId: state.selectedAgentId === agentId ? null : state.selectedAgentId,
    })),

  setRunning: (agentId, running) =>
    set((state) => {
      const next = new Set(state.runningAgentIds);
      if (running) next.add(agentId);
      else next.delete(agentId);
      return { runningAgentIds: next };
    }),
}));

