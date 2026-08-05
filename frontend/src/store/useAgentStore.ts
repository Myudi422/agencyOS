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

  fetchAgents: (workspaceId: string) => Promise<void>;
  fetchLogs: (agentId: string) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
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

  fetchLogs: async (agentId) => {
    set({ loadingLogs: true });
    try {
      const data = await fetchApi<AgentRunLog[]>(`/agents/${agentId}/logs?limit=20`);
      set({ logs: data || [] });
    } catch (e) {
      console.error("Failed to fetch agent logs:", e);
    } finally {
      set({ loadingLogs: false });
    }
  },

  deleteLog: async (logId) => {
    try {
      await fetchApi(`/agents/logs/${logId}`, { method: "DELETE" });
      set((state) => ({
        logs: state.logs.filter((l) => l.id !== logId),
      }));
    } catch (e) {
      console.error("Failed to delete agent log:", e);
      throw e;
    }
  },

  selectAgent: (id) => {
    set({ selectedAgentId: id, logs: [] });
    if (id) get().fetchLogs(id);
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
