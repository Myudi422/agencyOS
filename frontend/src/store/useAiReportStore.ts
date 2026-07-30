import { create } from "zustand";

export interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp?: string;
}

export type SummaryScope = "all" | "today" | "7d" | "30d";

interface AiMeta {
  period_label?: string;
  total_accounts?: number;
  generated_at?: string;
  workspace_id?: string;
  account_ids?: string[];
  date_from?: string;
  date_to?: string;
}

interface AiReportStore {
  // ── Floating Panel ──
  isFloatingOpen: boolean;
  // ── Legacy modal state (preserved for backward compat) ──
  isAiModalOpen: boolean;
  isAiMinimized: boolean;
  // ── Data ──
  aiSummaryText: string;
  aiLoading: boolean;
  aiMeta: AiMeta | null;
  chatMessages: ChatMessage[];
  // ── Summary scope ──
  summaryScope: SummaryScope;
  hasSummarySession: boolean; // true after first summary is loaded

  // ── Actions: Floating Panel ──
  openFloating: () => void;
  closeFloating: () => void;
  // ── Actions: Legacy modal ──
  openAiModal: () => void;
  closeAiModal: () => void;
  minimizeAiModal: () => void;
  restoreAiModal: () => void;
  // ── Actions: Data ──
  setAiSummaryText: (text: string) => void;
  setAiLoading: (loading: boolean) => void;
  setAiMeta: (meta: AiMeta | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  setSummaryScope: (scope: SummaryScope) => void;
  setHasSummarySession: (v: boolean) => void;
  resetAiReport: () => void;
}

export const useAiReportStore = create<AiReportStore>((set) => ({
  isFloatingOpen: false,
  isAiModalOpen: false,
  isAiMinimized: false,
  aiSummaryText: "",
  aiLoading: false,
  aiMeta: null,
  chatMessages: [],
  summaryScope: "today",
  hasSummarySession: false,

  openFloating: () => set({ isFloatingOpen: true, isAiMinimized: false }),
  closeFloating: () => set({ isFloatingOpen: false }),

  openAiModal: () => set({ isAiModalOpen: true, isAiMinimized: false }),
  closeAiModal: () =>
    set({ isAiModalOpen: false, isAiMinimized: false, isFloatingOpen: false }),
  minimizeAiModal: () => set({ isAiModalOpen: false, isAiMinimized: true }),
  restoreAiModal: () =>
    set({ isAiModalOpen: true, isAiMinimized: false, isFloatingOpen: true }),

  setAiSummaryText: (text) => set({ aiSummaryText: text }),
  setAiLoading: (loading) => set({ aiLoading: loading }),
  setAiMeta: (meta) => set({ aiMeta: meta }),
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  setSummaryScope: (scope) => set({ summaryScope: scope }),
  setHasSummarySession: (v) => set({ hasSummarySession: v }),

  resetAiReport: () =>
    set({
      isFloatingOpen: false,
      isAiModalOpen: false,
      isAiMinimized: false,
      aiSummaryText: "",
      aiLoading: false,
      aiMeta: null,
      chatMessages: [],
      summaryScope: "today",
      hasSummarySession: false,
    }),
}));
