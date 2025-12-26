"use client";

import { useLocale } from "@/contexts/LocaleContext";

const LABELS: Record<string, string> = {
  ko: "KR",
  en: "EN",
  ja: "JP",
  de: "DE"
};

export default function LanguageSwitcher() {
  const { locale, locales, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 shadow-sm">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded-full px-2 py-1 text-[11px] font-semibold transition ${
            locale === code ? "bg-primary/10 text-primary" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {LABELS[code] ?? code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
