"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ensureLocaleResources } from "@/i18n/i18n";

const LOCALES = [
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "de", label: "German", flag: "🇩🇪" }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const locale = i18n.language.split("-")[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = useMemo(
    () => LOCALES.find((item) => item.code === locale) ?? LOCALES[0],
    [locale]
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-primary/30 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="언어 선택"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="sr-only">{current.label}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {LOCALES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={async () => {
                  await ensureLocaleResources(item.code);
                  i18n.changeLanguage(item.code);
                  setOpen(false);
                }}
                className={`flex items-center justify-center rounded-xl border px-3 py-2 text-lg transition ${
                  item.code === locale
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent text-gray-700 hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                }`}
                aria-label={item.label}
                title={item.label}
              >
                {item.flag}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
