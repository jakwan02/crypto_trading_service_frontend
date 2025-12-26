export function formatCompactNumber(value: number, locale?: string): string {
  if (!Number.isFinite(value)) return "-";
  const ax = Math.abs(value);
  if (ax === 0) return "0";

  const lang = (locale || "en").toLowerCase();
  if (lang.startsWith("ko")) {
    if (ax >= 1_000_000_000_000) return (value / 1_000_000_000_000).toFixed(2).replace(/\.00$/, "") + "조";
    if (ax >= 100_000_000) return (value / 100_000_000).toFixed(2).replace(/\.00$/, "") + "억";
    if (ax >= 10_000) return (value / 10_000).toFixed(2).replace(/\.00$/, "") + "만";
    if (ax >= 1_000) return (value / 1_000).toFixed(2).replace(/\.00$/, "") + "천";
    if (ax >= 100) return (value / 100).toFixed(2).replace(/\.00$/, "") + "백";
    return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  }

  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 2 }).format(value);
}
