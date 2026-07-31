import { create } from "zustand";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logo_url?: string;
}

interface Client {
  id: string;
  name: string;
  brand_color: string;
}

export interface UploadTask {
  id: string;
  filename: string;
  fileSize: number;
  progress: number; // 0 to 100
  status: "uploading" | "completed" | "error";
  errorMessage?: string;
  folder: string;
}

interface StoreState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  clients: Client[];
  activeClientId: string | null; // 'all' or client ID
  isComposerOpen: boolean;
  isSettingsOpen: boolean;
  composerPreselectedAccounts: string[];
  composerInitialPost: any | null;
  composerInitialBrief: { caption?: string; hashtags?: string; post_type?: string; account_ids?: string[] } | null;
  uploadTasks: UploadTask[];

  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (ws: Workspace) => void;
  setClients: (clients: Client[]) => void;
  setActiveClientId: (id: string | null) => void;
  openComposer: (accountIds?: string[], initialPost?: any) => void;
  openComposerWithBrief: (brief: { caption?: string; hashtags?: string; post_type?: string; account_ids?: string[] }) => void;
  closeComposer: () => void;
  openSettings: () => void;
  closeSettings: () => void;

  addUploadTasks: (tasks: UploadTask[]) => void;
  updateUploadTask: (id: string, updates: Partial<UploadTask>) => void;
  removeUploadTask: (id: string) => void;
  clearCompletedUploads: () => void;
}

export const useStore = create<StoreState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  clients: [],
  activeClientId: null,
  isComposerOpen: false,
  isSettingsOpen: false,
  composerPreselectedAccounts: [],
  composerInitialPost: null,
  composerInitialBrief: null,
  uploadTasks: [],

  setWorkspaces: (workspaces) => set({ 
    workspaces, 
    activeWorkspace: workspaces.length > 0 ? workspaces[0] : null 
  }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  setClients: (clients) => set({ clients }),
  setActiveClientId: (activeClientId) => set({ activeClientId }),
  openComposer: (accountIds = [], initialPost = null) => set({ isComposerOpen: true, composerPreselectedAccounts: accountIds, composerInitialPost: initialPost, composerInitialBrief: null }),
  openComposerWithBrief: (brief) => set({
    isComposerOpen: true,
    composerPreselectedAccounts: brief.account_ids || [],
    composerInitialPost: null,
    composerInitialBrief: brief
  }),
  closeComposer: () => set({ isComposerOpen: false, composerPreselectedAccounts: [], composerInitialPost: null, composerInitialBrief: null }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),


  addUploadTasks: (newTasks) => set((state) => ({ uploadTasks: [...state.uploadTasks, ...newTasks] })),
  updateUploadTask: (id, updates) => set((state) => ({
    uploadTasks: state.uploadTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
  })),
  removeUploadTask: (id) => set((state) => ({
    uploadTasks: state.uploadTasks.filter((t) => t.id !== id)
  })),
  clearCompletedUploads: () => set((state) => ({
    uploadTasks: state.uploadTasks.filter((t) => t.status === "uploading")
  }))
}));
