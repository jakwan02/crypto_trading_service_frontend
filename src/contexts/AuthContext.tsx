"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/appClient";
import { clearAcc, getAcc, setAcc } from "@/lib/token";
import { requestGoogleIdToken } from "@/lib/googleOidc";
import { parseAuthError } from "@/lib/auth/authErrors";

type PlanCode = "free" | "pro";

type Plan = {
  code: PlanCode;
  name?: string | null;
};

type AppUser = {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
  name?: string | null;
  role?: string;
  plan?: string;
  mfa_enabled?: boolean;
};

type AuthPayload = {
  access_token?: string;
  user?: AppUser;
  plan?: Plan | null;
  mfa_required?: boolean;
};

type LoginResult = {
  mfaRequired?: boolean;
};

type AuthContextValue = {
  user: AppUser | null;
  sessionReady: boolean;
  plan: Plan | null;
  isPro: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string, options?: { mfaCode?: string }) => Promise<LoginResult>;
  signup: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  sessionReady: false,
  plan: null,
  isPro: false,
  signInWithGoogle: async () => {},
  signInWithGoogleIdToken: async () => {},
  signOut: async () => {},
  login: async () => ({}),
  signup: async () => {},
  refresh: async () => {}
});

function getAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) {
    throw new Error("Missing access token.");
  }
  return {
    Authorization: `Bearer ${token}`
  };
}

function parseMfaError(err: unknown): LoginResult | null {
  const info = parseAuthError(err);
  if (!info || info.code !== "mfa_required") return null;
  return { mfaRequired: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // 변경 이유: 비로그인(쿠키 없음) 최초 방문 시 refresh 401 노이즈를 방지하고, 세션 복구는 쿠키가 있을 때만 시도합니다.
  const clearSession = useCallback(() => {
    clearAcc();
    setUser(null);
    setPlan(null);
  }, []);

  const applyAuthPayload = useCallback((payload: AuthPayload) => {
    if (!payload?.access_token) {
      throw new Error("Invalid auth response.");
    }
    setAcc(payload.access_token);
    setUser(payload.user ?? null);
    if (payload.plan) {
      setPlan(payload.plan);
    } else if (payload.user?.plan) {
      setPlan({ code: payload.user.plan as PlanCode });
    } else {
      setPlan(null);
    }
    setSessionReady(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const payload = await apiRequest<AuthPayload>("/auth/refresh", { method: "POST", csrf: true });
      if (!payload?.access_token) {
        throw new Error("Invalid refresh response.");
      }
      setAcc(payload.access_token);
      const me = await apiRequest<AppUser>("/account/me", {
        method: "GET",
        headers: getAuthHeaders()
      });
      setUser(me ?? null);
      if (me?.plan) {
        setPlan({ code: me.plan as PlanCode });
      } else {
        setPlan(payload.plan ?? null);
      }
    } catch {
      clearSession();
    } finally {
      setSessionReady(true);
    }
  }, [clearSession]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const hasCsrfCookie = document.cookie.split(";").some((part) => part.trim().startsWith("csrf="));
      if (!hasCsrfCookie) {
        setSessionReady(true);
        return;
      }
    }
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string, options?: { mfaCode?: string }) => {
      const payload: Record<string, string> = { email, password };
      if (options?.mfaCode) payload.mfa_code = options.mfaCode;

      try {
        const response = await apiRequest<AuthPayload>("/auth/login", {
          method: "POST",
          json: payload
        });

        applyAuthPayload(response);
        return {};
      } catch (err) {
        const mfa = parseMfaError(err);
        if (mfa) return mfa;
        throw err;
      }
    },
    [applyAuthPayload]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      await apiRequest<{ ok: boolean }>("/auth/register", {
        method: "POST",
        json: { email, password }
      });
    },
    []
  );

  const signInWithGoogleIdToken = useCallback(
    async (idToken: string) => {
      const response = await apiRequest<AuthPayload>("/auth/google", {
        method: "POST",
        json: { id_token: idToken }
      });
      applyAuthPayload(response);
    },
    [applyAuthPayload]
  );

  const signInWithGoogle = useCallback(async () => {
    const idToken = await requestGoogleIdToken();
    await signInWithGoogleIdToken(idToken);
  }, [signInWithGoogleIdToken]);

  const signOut = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      clearSession();
      setSessionReady(true);
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      sessionReady,
      plan,
      isPro: plan?.code === "pro",
      signInWithGoogle,
      signInWithGoogleIdToken,
      signOut,
      login,
      signup,
      refresh
    }),
    [login, plan, refresh, sessionReady, signInWithGoogle, signInWithGoogleIdToken, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
