import { create } from "zustand";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = "info") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().showToast(msg, "success"),
  error: (msg: string) => useToastStore.getState().showToast(msg, "error"),
  info: (msg: string) => useToastStore.getState().showToast(msg, "info"),
  warning: (msg: string) => useToastStore.getState().showToast(msg, "warning"),
};
