"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { formatCompactNumber } from "@/lib/format";
import { MetricItemSchema, SymbolItemSchema } from "@/lib/schemas";

type MarketBootstrapPayload = {
  order: string[];
  symbols: unknown[];
  metrics: unknown[];
  tickers: unknown[];
};

type RankingRow = {
  symbol: string;
  market?: string | null;
  baseAsset?: string | null;
  quoteAsset?: string | null;
  price: number | null;
  quoteVolume: number | null;
  pctChange: number | null;
};

const DEFAULT_API_BASE_URL = "http://localhost:8001";

function stripSlash(u: string) {
  return String(u || "").trim().replace(/\/+$/, "");
}

function stripApiSuffix(u: string) {
  const x = stripSlash(u);
  return x.replace(/\/api$/i, "");
}

function toApiBase(): string {
  const envRaw = String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (envRaw === "/" || envRaw.startsWith("/")) return "/api";
  const env = (envRaw || DEFAULT_API_BASE_URL).trim();
  const root = stripApiSuffix(env);
  return root.endsWith("/api") ? root : `${root}/api`;
}

function withApiToken(headers?: HeadersInit): HeadersInit | undefined {
  const token = String(process.env.NEXT_PUBLIC_API_TOKEN || "").trim();
  if (!token) return headers;
  return { ...(headers || {}), "X-API-Token": token };
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseRanking(payload: MarketBootstrapPayload): RankingRow[] {
  const symMap: Record<string, { market?: string; baseAsset?: string; quoteAsset?: string }> = {};
  for (const s of payload.symbols ?? []) {
    const p = SymbolItemSchema.safeParse(s);
    if (!p.success) continue;
    const symbol = String(p.data.symbol || "").trim();
    if (!symbol) continue;
    symMap[symbol] = {
      market: (p.data.market as string | undefined) ?? undefined,
      baseAsset: (p.data.base_asset as string | undefined) ?? (p.data.baseAsset as string | undefined) ?? undefined,
      quoteAsset: (p.data.quote_asset as string | undefined) ?? (p.data.quoteAsset as string | undefined) ?? undefined
    };
  }

  const metricMap: Record<string, { price: number | null; quoteVolume: number | null; pctChange: number | null }> = {};
  for (const m of payload.metrics ?? []) {
    const p = MetricItemSchema.safeParse(m);
    if (!p.success) continue;
    const symbol = String(p.data.symbol || "").trim();
    if (!symbol) continue;
    const price = numOrNull((p.data.price as unknown) ?? (p.data.close as unknown));
    const quoteVolume = numOrNull((p.data.quote_volume as unknown) ?? (p.data.quoteVolume as unknown));
    const pctChange = numOrNull((p.data.pct_change as unknown) ?? (p.data.pctChange as unknown));
    metricMap[symbol] = { price, quoteVolume, pctChange };
  }

  const out: RankingRow[] = [];
  for (const symbol of payload.order ?? []) {
    const sym = symMap[symbol] || {};
    const met = metricMap[symbol] || { price: null, quoteVolume: null, pctChange: null };
    out.push({
      symbol,
      market: sym.market ?? null,
      baseAsset: sym.baseAsset ?? null,
      quoteAsset: sym.quoteAsset ?? null,
      price: met.price,
      quoteVolume: met.quoteVolume,
      pctChange: met.pctChange
    });
  }
  return out;
}

async function fetchBootstrap(params: {
  market: string;
  sort: string;
  order: "asc" | "desc";
  window: string;
  limit: number;
}): Promise<MarketBootstrapPayload> {
  const api = toApiBase();
  const q = new URLSearchParams({
    market: params.market,
    scope: "managed",
    sort: params.sort,
    order: params.order,
    window: params.window,
    limit: String(params.limit)
  });
  const url = `${api}/market/bootstrap?${q.toString()}`;
  const res = await fetch(url, { cache: "no-store", headers: withApiToken() });
  if (!res.ok) throw new Error(`rankings_bootstrap_${res.status}`);
  return (await res.json()) as MarketBootstrapPayload;
}

export default function RankingsPage() {
  const { t, i18n } = useTranslation();
  const locale = String(i18n.language || "ko");

  const topTurnoverQ = useQuery({
    queryKey: ["rankings.turnover"],
    queryFn: async () => parseRanking(await fetchBootstrap({ market: "spot", sort: "qv", order: "desc", window: "1d", limit: 30 }))
  });
  const topGainersQ = useQuery({
    queryKey: ["rankings.gainers"],
    queryFn: async () => parseRanking(await fetchBootstrap({ market: "spot", sort: "pct", order: "desc", window: "1d", limit: 30 }))
  });

  const turnover = useMemo(() => (topTurnoverQ.data ?? []).slice(0, 20), [topTurnoverQ.data]);
  const gainers = useMemo(() => (topGainersQ.data ?? []).slice(0, 20), [topGainersQ.data]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("rankings.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("rankings.desc")}</p>
        </header>

        {topTurnoverQ.isError || topGainersQ.isError ? (
          <ApiErrorView
            error={topTurnoverQ.error ?? topGainersQ.error}
            onRetry={() => {
              void topTurnoverQ.refetch();
              void topGainersQ.refetch();
            }}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("rankings.topTurnover")}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[520px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500">
                    <th className="py-2 pr-4">{t("rankings.symbol")}</th>
                    <th className="py-2 pr-4">{t("rankings.price")}</th>
                    <th className="py-2 pr-4">{t("rankings.quoteVolume")}</th>
                    <th className="py-2 pr-4">{t("rankings.change24h")}</th>
                  </tr>
                </thead>
                <tbody>
                  {turnover.length === 0 && !topTurnoverQ.isFetching ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-gray-500">
                        {t("rankings.empty")}
                      </td>
                    </tr>
                  ) : null}
                  {turnover.map((r) => (
                    <tr key={r.symbol} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-semibold text-gray-900">{r.symbol}</td>
                      <td className="py-3 pr-4 text-xs text-gray-700">
                        {r.price != null ? r.price.toLocaleString(locale, { maximumFractionDigits: 8 }) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-700">
                        {r.quoteVolume != null ? formatCompactNumber(r.quoteVolume, locale) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold">
                        {r.pctChange != null ? (
                          <span className={r.pctChange >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {r.pctChange >= 0 ? "+" : ""}
                            {r.pctChange.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("rankings.topGainers")}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[520px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500">
                    <th className="py-2 pr-4">{t("rankings.symbol")}</th>
                    <th className="py-2 pr-4">{t("rankings.price")}</th>
                    <th className="py-2 pr-4">{t("rankings.quoteVolume")}</th>
                    <th className="py-2 pr-4">{t("rankings.change24h")}</th>
                  </tr>
                </thead>
                <tbody>
                  {gainers.length === 0 && !topGainersQ.isFetching ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-gray-500">
                        {t("rankings.empty")}
                      </td>
                    </tr>
                  ) : null}
                  {gainers.map((r) => (
                    <tr key={r.symbol} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-semibold text-gray-900">{r.symbol}</td>
                      <td className="py-3 pr-4 text-xs text-gray-700">
                        {r.price != null ? r.price.toLocaleString(locale, { maximumFractionDigits: 8 }) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-700">
                        {r.quoteVolume != null ? formatCompactNumber(r.quoteVolume, locale) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold">
                        {r.pctChange != null ? (
                          <span className={r.pctChange >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {r.pctChange >= 0 ? "+" : ""}
                            {r.pctChange.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
