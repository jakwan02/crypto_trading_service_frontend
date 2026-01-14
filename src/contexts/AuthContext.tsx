"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/appClient";
import { clearAcc, getAcc, setAcc } from "@/lib/token";
import { requestGoogleIdToken } from "@/lib/googleOidc";
import { parseAuthError } from "@/lib/auth/authErrors";
import i18n, { ensureLocaleResources } from "@/i18n/i18n";

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
  has_password?: boolean;
  is_active?: boolean;
};

type AuthPayload = {
  access_token?: string;
  user?: AppUser;
  plan?: Plan | null;
  mfa_required?: boolean;
};

type RefreshResponse = {
  access_token?: string;
  token_type?: string;
};

type AccountMeResponse = AppUser;

type AccountSettingsResponse = {
  prefs?: {
    lang?: string;
    theme?: string;
    tz?: string;
  };
  notify?: Record<string, unknown>;
};

type LoginResult = {
  mfaRequired?: boolean;
};

type AuthContextValue = {
  user: AppUser | null;
  sessionReady: boolean;
  plan: Plan | null;
  isPro: boolean;
  signInWithGoogle: () => Promise<LoginResult>;
  signInWithGoogleIdToken: (idToken: string, options?: { mfaCode?: string }) => Promise<LoginResult>;
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
  signInWithGoogle: async () => ({}),
  signInWithGoogleIdToken: async () => ({}),
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

function detectTimezone(): string {
  if (typeof Intl === "undefined") return "";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

async function applySettingsToRuntime(settings: AccountSettingsResponse | null) {
  if (!settings?.prefs) return;
  const base = String(settings.prefs.lang || "").split("-")[0];
  if (base && ["ko", "en", "ja", "de"].includes(base) && i18n.language !== base) {
    await ensureLocaleResources(base);
    i18n.changeLanguage(base);
  }
  const theme = String(settings.prefs.theme || "").trim().toLowerCase();
  if (typeof document !== "undefined" && (theme === "light" || theme === "dark")) {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
  if (typeof window !== "undefined" && (theme === "light" || theme === "dark")) {
    window.localStorage.setItem("theme", theme);
  }
  if (typeof window !== "undefined") {
    const tz = String(settings.prefs.tz || "").trim();
    if (tz) window.localStorage.setItem("tz", tz);
  }
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
  const queryClient = useQueryClient();

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

  const hydrateMe = useCallback(async () => {
    const me = await apiRequest<AccountMeResponse>("/account/me", {
      method: "GET",
      headers: getAuthHeaders()
    });
    setUser(me ?? null);
    if (me?.plan) {
      setPlan({ code: me.plan as PlanCode });
    } else {
      setPlan(null);
    }
  }, []);

  const hydrateSettings = useCallback(async () => {
    try {
      const tz = detectTimezone();
      const headers: HeadersInit = {
        ...getAuthHeaders()
      };
      if (tz) {
        (headers as Record<string, string>)["X-Timezone"] = tz;
      }
      const settings = await apiRequest<AccountSettingsResponse>("/account/settings", {
        method: "GET",
        headers
      });
      queryClient.setQueryData(["accountSettings"], settings);
      await applySettingsToRuntime(settings);
    } catch {
      // ignore
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    try {
      const payload = await apiRequest<RefreshResponse>("/auth/refresh", { method: "POST", csrf: true });
      if (!payload?.access_token) {
        throw new Error("Invalid refresh response.");
      }
      setAcc(payload.access_token);
      await hydrateMe();
      await hydrateSettings();
    } catch {
      clearSession();
    } finally {
      setSessionReady(true);
    }
  }, [clearSession, hydrateMe, hydrateSettings]);

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
        try {
          await hydrateMe();
          await hydrateSettings();
        } catch {
          // ignore
        }
        return {};
      } catch (err) {
        const mfa = parseMfaError(err);
        if (mfa) return mfa;
        throw err;
      }
    },
    [applyAuthPayload, hydrateMe]
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
    async (idToken: string, options?: { mfaCode?: string }) => {
      // 변경 이유: Google 로그인에서도 MFA 재요청(mfa_code) 플로우를 지원
      const payload: Record<string, string> = { id_token: idToken };
      if (options?.mfaCode) payload.mfa_code = options.mfaCode;
      try {
        const response = await apiRequest<AuthPayload>("/auth/google", {
          method: "POST",
          json: payload
        });
        applyAuthPayload(response);
        try {
          await hydrateMe();
          await hydrateSettings();
        } catch {
          // ignore
        }
        return {};
      } catch (err) {
        const mfa = parseMfaError(err);
        if (mfa) return mfa;
        throw err;
      }
    },
    [applyAuthPayload, hydrateMe]
  );

  const signInWithGoogle = useCallback(async () => {
    const idToken = await requestGoogleIdToken();
    return signInWithGoogleIdToken(idToken);
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
    [login, plan, refresh, sessionReady, signInWithGoogle, signInWithGoogleIdToken, signOut, signup, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
