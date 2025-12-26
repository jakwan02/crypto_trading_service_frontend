"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./resources";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      supportedLngs: ["ko", "en", "ja", "de"],
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
    if (typeof document === "undefined") return;
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  });
}

export default i18n;
