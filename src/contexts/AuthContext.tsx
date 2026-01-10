"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, type ApiError } from "@/lib/appClient";
import { clearAcc, getAcc, setAcc } from "@/lib/token";
import { requestGoogleIdToken } from "@/lib/googleOidc";

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
};

type AuthPayload = {
  access_token?: string;
  user?: AppUser;
  plan?: Plan | null;
  mfa_required?: boolean;
  mfa_ticket?: string;
};

type LoginResult = {
  mfaRequired?: boolean;
  mfaTicket?: string;
};

type AuthContextValue = {
  user: AppUser | null;
  sessionReady: boolean;
  plan: Plan | null;
  isPro: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string, options?: { otpCode?: string; mfaTicket?: string }) => Promise<LoginResult>;
  signup: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  sessionReady: false,
  plan: null,
  isPro: false,
  signInWithGoogle: async () => {},
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
  if (!err || typeof err !== "object") return null;
  const typed = err as ApiError;
  const payload = typed.payload as Record<string, unknown> | undefined;
  if (typed.status !== 401 || !payload) return null;
  if (payload.mfa_required !== true) return null;
  return {
    mfaRequired: true,
    mfaTicket: typeof payload.mfa_ticket === "string" ? payload.mfa_ticket : undefined
  };
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
    setPlan(payload.plan ?? null);
    setSessionReady(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const payload = await apiRequest<AuthPayload>("/auth/refresh", { method: "POST", csrf: true });
      if (!payload?.access_token) {
        throw new Error("Invalid refresh response.");
      }
      setAcc(payload.access_token);
      const me = await apiRequest<{ user: AppUser; plan: Plan | null }>("/account/me", {
        method: "GET",
        headers: getAuthHeaders()
      });
      setUser(me?.user ?? null);
      setPlan(me?.plan ?? payload.plan ?? null);
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
    async (email: string, password: string, options?: { otpCode?: string; mfaTicket?: string }) => {
      const payload: Record<string, string> = { email, password };
      if (options?.otpCode) payload.otp_code = options.otpCode;
      if (options?.mfaTicket) payload.mfa_ticket = options.mfaTicket;

      try {
        const response = await apiRequest<AuthPayload>("/auth/login", {
          method: "POST",
          json: payload
        });

        if (response?.mfa_required) {
          return { mfaRequired: true, mfaTicket: response.mfa_ticket };
        }

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

  const signInWithGoogle = useCallback(async () => {
    const idToken = await requestGoogleIdToken();
    const response = await apiRequest<AuthPayload>("/auth/google", {
      method: "POST",
      json: { id_token: idToken }
    });
    applyAuthPayload(response);
  }, [applyAuthPayload]);

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
      signOut,
      login,
      signup,
      refresh
    }),
    [login, plan, refresh, sessionReady, signInWithGoogle, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
