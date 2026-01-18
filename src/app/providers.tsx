"use client";

import { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nextProvider } from "react-i18next";
import i18n, { ensureLocaleResources } from "@/i18n/i18n";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {}
});

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  // QueryClient는 한 번만 생성되도록 useState 래핑
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  const [theme, setTheme] = useState<ThemeMode>("light");
  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
    []
  );
  const themeValue = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme]);

  useEffect(() => {
    // 변경 이유: 서버/설정 페이지에서 적용된 theme를 새로고침 후에도 유지하고 Tailwind dark 클래스를 동기화
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      queueMicrotask(() => setTheme(stored));
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("i18nextLng") || "";
    const base = stored.split("-")[0];
    if (!base) return;
    if (!["ko", "en", "ja", "de"].includes(base)) return;
    if (i18n.language === base) return;

    void ensureLocaleResources(base).then(() => {
      i18n.changeLanguage(base);
    });
  }, []);

  return (
    <ThemeContext.Provider value={themeValue}>
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>{children}</AuthProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </ThemeContext.Provider>
  );
}
