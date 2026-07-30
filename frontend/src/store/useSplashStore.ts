import { create } from "zustand";

interface SplashState {
  isVisible: boolean;
  message: string;
  showSplash: (message?: string, autoHideMs?: number) => void;
  hideSplash: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  isVisible: false,
  message: "Memuat Shiera Engine...",
  showSplash: (message = "Memuat Shiera Engine...", autoHideMs) => {
    set({ isVisible: true, message });
    if (autoHideMs) {
      setTimeout(() => {
        set({ isVisible: false });
      }, autoHideMs);
    }
  },
  hideSplash: () => set({ isVisible: false }),
}));
