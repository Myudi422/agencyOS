import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User as FirebaseUser } from "firebase/auth";

export interface SubscriptionInfo {
  plan_tier: "trial" | "creator" | "agency" | "studio";
  plan_name: string;
  status: "active" | "trial" | "expired" | "cancelled" | "past_due";
  posts_used: number;
  posts_limit: number;
  posts_remaining: number;
  expires_at: string | null;
  is_expired: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_admin: boolean;
}

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: AuthUser | null;
  subscription: SubscriptionInfo | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  idToken: string | null;
  workspaceId: string | null;       // user's primary workspace ID
  needsOnboarding: boolean;         // true = no workspace yet, must complete setup

  setFirebaseUser: (fu: FirebaseUser | null) => void;
  setUser: (user: AuthUser | null) => void;
  setSubscription: (sub: SubscriptionInfo | null) => void;
  setIdToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setWorkspaceId: (id: string | null) => void;
  setNeedsOnboarding: (v: boolean) => void;
  logout: () => void;

  hasQuota: () => boolean;
  isSubscriptionExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      firebaseUser: null,
      user: null,
      subscription: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: true,
      idToken: null,
      workspaceId: null,
      needsOnboarding: false,

      setFirebaseUser: (fu) =>
        set({ firebaseUser: fu, isAuthenticated: !!fu }),

      setUser: (user) =>
        set({ user, isAdmin: user?.is_admin ?? false }),

      setSubscription: (subscription) => set({ subscription }),

      setIdToken: (token) => set({ idToken: token }),

      setLoading: (isLoading) => set({ isLoading }),

      setWorkspaceId: (workspaceId) => set({ workspaceId }),

      setNeedsOnboarding: (needsOnboarding) => set({ needsOnboarding }),

      logout: () =>
        set({
          firebaseUser: null,
          user: null,
          subscription: null,
          isAdmin: false,
          isAuthenticated: false,
          idToken: null,
          workspaceId: null,
          needsOnboarding: false,
        }),

      hasQuota: () => {
        const { user, subscription } = get();
        if (user?.is_admin) return true;
        if (!subscription) return false;
        if (subscription.is_expired) return false;
        return subscription.posts_remaining > 0;
      },

      isSubscriptionExpired: () => {
        const { user, subscription } = get();
        if (user?.is_admin) return false;
        if (!subscription) return true;
        return subscription.is_expired || subscription.status === "expired";
      },
    }),
    {
      name: "agencyos-auth",
      partialize: (state) => ({
        user: state.user,
        subscription: state.subscription,
        isAdmin: state.isAdmin,
        idToken: state.idToken,
        workspaceId: state.workspaceId,
        needsOnboarding: state.needsOnboarding,
      }),
    }
  )
);
