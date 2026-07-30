import { create } from "zustand";

export interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp?: string;
}

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
  isAiModalOpen: boolean;
  isAiMinimized: boolean;
  aiSummaryText: string;
  aiLoading: boolean;
  aiMeta: AiMeta | null;
  chatMessages: ChatMessage[];

  openAiModal: () => void;
  closeAiModal: () => void;
  minimizeAiModal: () => void;
  restoreAiModal: () => void;
  setAiSummaryText: (text: string) => void;
  setAiLoading: (loading: boolean) => void;
  setAiMeta: (meta: AiMeta | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  resetAiReport: () => void;
}

export const useAiReportStore = create<AiReportStore>((set) => ({
  isAiModalOpen: false,
  isAiMinimized: false,
  aiSummaryText: "",
  aiLoading: false,
  aiMeta: null,
  chatMessages: [],

  openAiModal: () => set({ isAiModalOpen: true, isAiMinimized: false }),
  closeAiModal: () => set({ isAiModalOpen: false, isAiMinimized: false }),
  minimizeAiModal: () => set({ isAiModalOpen: false, isAiMinimized: true }),
  restoreAiModal: () => set({ isAiModalOpen: true, isAiMinimized: false }),
  setAiSummaryText: (text) => set({ aiSummaryText: text }),
  setAiLoading: (loading) => set({ aiLoading: loading }),
  setAiMeta: (meta) => set({ aiMeta: meta }),
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  resetAiReport: () => set({
    isAiModalOpen: false,
    isAiMinimized: false,
    aiSummaryText: "",
    aiLoading: false,
    aiMeta: null,
    chatMessages: [],
  }),
}));
