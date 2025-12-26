"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./resources";

const supported = ["ko", "en", "ja", "de"] as const;

async function loadLocaleBundle(lng: string) {
  const base = String(lng || "").split("-")[0];
  if (!base) return;
  if (i18n.hasResourceBundle(base, "common")) return;

  let mod: { default: Record<string, Record<string, unknown>> } | null = null;
  if (base === "ja") mod = await import("./locales/ja");
  if (base === "de") mod = await import("./locales/de");
  if (!mod) return;

  const bundle = mod.default;
  for (const [ns, res] of Object.entries(bundle)) {
    i18n.addResourceBundle(base, ns, res, true, true);
  }
}

export async function ensureLocaleResources(lng: string) {
  await loadLocaleBundle(lng);
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      supportedLngs: supported,
      nonExplicitSupportedLngs: true,
      defaultNS: "common",
      ns: [
        "common",
        "nav",
        "home",
        "market",
        "table",
        "chart",
        "ai",
        "news",
        "alertsPage",
        "auth",
        "account",
        "upgrade",
        "payment",
        "education",
        "legal",
        "footer"
      ],
      nsSeparator: ".",
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"]
      },
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    });

  i18n.on("languageChanged", (lng) => {
    void loadLocaleBundle(lng);
    if (typeof document === "undefined") return;
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  });

  void loadLocaleBundle(i18n.language);
}

export default i18n;
