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

interface StoreState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  clients: Client[];
  activeClientId: string | null; // 'all' or client ID
  isComposerOpen: boolean;
  composerPreselectedAccounts: string[];

  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (ws: Workspace) => void;
  setClients: (clients: Client[]) => void;
  setActiveClientId: (id: string | null) => void;
  openComposer: (accountIds?: string[]) => void;
  closeComposer: () => void;
}

export const useStore = create<StoreState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  clients: [],
  activeClientId: null,
  isComposerOpen: false,
  composerPreselectedAccounts: [],

  setWorkspaces: (workspaces) => set({ 
    workspaces, 
    activeWorkspace: workspaces.length > 0 ? workspaces[0] : null 
  }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  setClients: (clients) => set({ clients }),
  setActiveClientId: (activeClientId) => set({ activeClientId }),
  openComposer: (accountIds = []) => set({ isComposerOpen: true, composerPreselectedAccounts: accountIds }),
  closeComposer: () => set({ isComposerOpen: false, composerPreselectedAccounts: [] }),
}));
