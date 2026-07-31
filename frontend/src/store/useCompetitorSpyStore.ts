import { create } from "zustand";

export interface AddJobState {
  jobId: string;
  username: string;
  percent: number;
  message: string;
  status: "running" | "done" | "error";
}

export interface SyncAllJobState {
  workspaceId: string;
  socialAccountId?: string;
  running: boolean;
  done: number;
  total: number;
  percent: number;
  message: string;
  errors: string[];
}

interface CompetitorSpyStore {
  activeAddJob: AddJobState | null;
  activeSyncAllJob: SyncAllJobState | null;
  setAddJob: (job: AddJobState | null) => void;
  setSyncAllJob: (job: SyncAllJobState | null) => void;
  clearAddJob: () => void;
  clearSyncAllJob: () => void;
}

export const useCompetitorSpyStore = create<CompetitorSpyStore>((set) => ({
  activeAddJob: null,
  activeSyncAllJob: null,
  setAddJob: (job) => set({ activeAddJob: job }),
  setSyncAllJob: (job) => set({ activeSyncAllJob: job }),
  clearAddJob: () => set({ activeAddJob: null }),
  clearSyncAllJob: () => set({ activeSyncAllJob: null }),
}));
