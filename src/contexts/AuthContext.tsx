"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

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
const supabase =
  SUPABASE_URL && SUPABASE_ANON
    ? createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

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
  const [sessionReady, setSessionReady] = useState(false);
  const [plan, setPlanState] = useState<Plan>("free");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("coindash_plan");
    if (saved === "free" || saved === "pro") setPlanState(saved);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setSessionReady(true);
      return;
    }

    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setUser(data.session?.user ?? null);
        setSessionReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setSessionReady(true);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const setPlan = useCallback((next: Plan) => {
    setPlanState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("coindash_plan", next);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      console.warn("Supabase env is missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: origin ? { redirectTo: origin } : undefined
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
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
    [plan, signInWithGoogle, signOut, user, sessionReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
