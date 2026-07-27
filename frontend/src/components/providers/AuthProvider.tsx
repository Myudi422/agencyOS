"use client";

import React, { useEffect } from "react";
import { onAuthChange, getIdToken } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { useStore } from "@/store/useStore";

/**
 * AuthProvider listens to Firebase auth state changes and syncs with backend.
 * After successful verification, it stores the user's workspace ID from the
 * backend response so all routes automatically scope data to the correct user.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setUser, setSubscription, setIdToken, setLoading, setWorkspaceId, setNeedsOnboarding, logout } =
    useAuthStore();
  const { setWorkspaces, setActiveWorkspace } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        logout();
        setLoading(false);
        return;
      }

      setFirebaseUser(firebaseUser);

      try {
        const token = await getIdToken();
        if (!token) {
          logout();
          setLoading(false);
          return;
        }
        setIdToken(token);

        // Verify token with backend → get AgencyOS user + subscription + workspace
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_BASE}/auth/firebase/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: token }),
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setSubscription(data.subscription);
          setNeedsOnboarding(data.needs_onboarding === true);

          // Store and activate the user's workspace
          if (data.workspace) {
            setWorkspaceId(data.workspace.id);
            setNeedsOnboarding(false);
            const ws = {
              id: data.workspace.id,
              name: data.workspace.name,
              slug: data.workspace.slug,
              timezone: data.workspace.timezone || "Asia/Jakarta",
            };
            setWorkspaces([ws]);
            setActiveWorkspace(ws);
          }
        }
      } catch (err) {
        console.error("Auth sync error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Refresh token every 55 minutes (Firebase tokens expire after 1 hour)
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await getIdToken();
      if (token) setIdToken(token);
    }, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
