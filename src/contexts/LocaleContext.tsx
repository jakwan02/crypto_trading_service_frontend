"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const SUPPORTED_LOCALES = ["ko", "en", "ja", "de"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  locales: Locale[];
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ko",
  setLocale: () => {},
  locales: [...SUPPORTED_LOCALES]
});

const STORAGE_KEY = "coindash_locale";

function pickBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "ko";
  const raw = navigator.language.split("-")[0];
  if (SUPPORTED_LOCALES.includes(raw as Locale)) return raw as Locale;
  return "ko";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    const next = saved && SUPPORTED_LOCALES.includes(saved) ? saved : pickBrowserLocale();
    setLocaleState(next);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    const rtl = locale === "ar";
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      locales: [...SUPPORTED_LOCALES]
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
