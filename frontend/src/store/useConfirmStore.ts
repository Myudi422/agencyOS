import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => Promise<void> | void;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  isLoading: boolean;
  openConfirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
  setIsLoading: (loading: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  options: null,
  isLoading: false,
  openConfirm: (options) => set({ isOpen: true, options, isLoading: false }),
  closeConfirm: () => set({ isOpen: false, options: null, isLoading: false }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

export const confirmModal = (options: ConfirmOptions) => {
  useConfirmStore.getState().openConfirm(options);
};
