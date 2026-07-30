import { create } from "zustand";

interface AiMeta {
  period_label?: string;
  total_accounts?: number;
  generated_at?: string;
}

interface AiReportStore {
  isAiModalOpen: boolean;
  isAiMinimized: boolean;
  aiSummaryText: string;
  aiLoading: boolean;
  aiCustomInstructions: string;
  aiMeta: AiMeta | null;

  openAiModal: () => void;
  closeAiModal: () => void;
  minimizeAiModal: () => void;
  restoreAiModal: () => void;
  setAiSummaryText: (text: string) => void;
  setAiLoading: (loading: boolean) => void;
  setAiCustomInstructions: (instructions: string) => void;
  setAiMeta: (meta: AiMeta | null) => void;
  resetAiReport: () => void;
}

export const useAiReportStore = create<AiReportStore>((set) => ({
  isAiModalOpen: false,
  isAiMinimized: false,
  aiSummaryText: "",
  aiLoading: false,
  aiCustomInstructions: "",
  aiMeta: null,

  openAiModal: () => set({ isAiModalOpen: true, isAiMinimized: false }),
  closeAiModal: () => set({ isAiModalOpen: false, isAiMinimized: false }),
  minimizeAiModal: () => set({ isAiModalOpen: false, isAiMinimized: true }),
  restoreAiModal: () => set({ isAiModalOpen: true, isAiMinimized: false }),
  setAiSummaryText: (text) => set({ aiSummaryText: text }),
  setAiLoading: (loading) => set({ aiLoading: loading }),
  setAiCustomInstructions: (instructions) => set({ aiCustomInstructions: instructions }),
  setAiMeta: (meta) => set({ aiMeta: meta }),
  resetAiReport: () => set({
    isAiModalOpen: false,
    isAiMinimized: false,
    aiSummaryText: "",
    aiLoading: false,
    aiMeta: null,
  }),
}));
