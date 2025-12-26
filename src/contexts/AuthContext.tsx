"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type Plan = "free" | "pro";

type AuthContextValue = {
  user: User | null;
  sessionReady: boolean;
  plan: Plan;
  isPro: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setPlan: (plan: Plan) => void;
};

const SUPABASE_URL = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const SUPABASE_ANON = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

let supabasePromise: Promise<SupabaseClient | null> | null = null;

async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  if (!supabasePromise) {
    supabasePromise = import("@supabase/supabase-js")
      .then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_ANON, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        })
      )
      .catch((err) => {
        console.warn("Supabase client load failed", err);
        supabasePromise = null;
        return null;
      });
  }
  return supabasePromise;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  sessionReady: false,
  plan: "free",
  isPro: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  setPlan: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(() => !SUPABASE_URL || !SUPABASE_ANON);
  const [plan, setPlanState] = useState<Plan>(() => {
    if (typeof window === "undefined") return "free";
    const saved = window.localStorage.getItem("coindash_plan");
    return saved === "free" || saved === "pro" ? saved : "free";
  });

  useEffect(() => {
    let alive = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      const client = await getSupabaseClient();
      if (!client) {
        if (alive) setSessionReady(true);
        return;
      }

      try {
        const { data } = await client.auth.getSession();
        if (!alive) return;
        setUser(data.session?.user ?? null);
      } catch {
        if (!alive) return;
      } finally {
        if (alive) setSessionReady(true);
      }

      const { data } = client.auth.onAuthStateChange((_event, session) => {
        if (!alive) return;
        setUser(session?.user ?? null);
      });
      subscription = data.subscription;
    };

    init();

    return () => {
      alive = false;
      subscription?.unsubscribe();
    };
  }, []);

  const setPlan = useCallback((next: Plan) => {
    setPlanState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("coindash_plan", next);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const client = await getSupabaseClient();
    if (!client) {
      console.warn("Supabase env is missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    await client.auth.signInWithOAuth({
      provider: "google",
      options: origin ? { redirectTo: origin } : undefined
    });
  }, []);

  const signOut = useCallback(async () => {
    const client = await getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      sessionReady,
      plan,
      isPro: plan === "pro",
      signInWithGoogle,
      signOut,
      setPlan
    }),
    [plan, signInWithGoogle, signOut, user, sessionReady, setPlan]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
