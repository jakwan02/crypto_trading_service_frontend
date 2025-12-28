// filename: frontend/components/SymbolTable.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useSymbols, type SymbolRow, type MetricWindow } from "@/hooks/useSymbols";
import { formatCompactNumber } from "@/lib/format";
import { useSymbolsStore, SortKey } from "@/store/useSymbolStore";

const columnHelper = createColumnHelper<SymbolRow>();

type Props = {
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  limit?: number;
  showToolbar?: boolean;
  filterFn?: (row: SymbolRow) => boolean;
};

function LoadingBar() {
  return <span className="inline-block h-3 w-10 animate-pulse rounded bg-gray-200" />;
}

const SORTABLE: Set<string> = new Set(["symbol", "price", "volume", "quoteVolume", "change24h", "time"]);
const WIN_OPTS: MetricWindow[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M", "1Y"];
const PRICE_FLASH_MS = 520;
const BLINK_MS = 320;

function winLabel(w: MetricWindow) {
  return String(w);
}

function priceFrac(x: number): number {
  const ax = Math.abs(x);
  if (!Number.isFinite(ax) || ax === 0) return 4;
  if (ax >= 1000) return 2;
  if (ax >= 100) return 3;
  if (ax >= 1) return 4;
  if (ax >= 0.01) return 6;
  if (ax >= 0.0001) return 8;
  return 10;
}

function fmtPrice(x: number, locale: string): string {
  if (!Number.isFinite(x)) return "-";
  const frac = priceFrac(x);
  return x.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: frac
  });
}

function fmtWithUnit(value: number, unit: string | undefined, locale: string): string {
  const base = formatCompactNumber(value, locale);
  if (base === "-") return base;
  const u = (unit || "").trim();
  return u ? `${base} ${u}` : base;
}

export default function SymbolTable({
  searchTerm,
  onSearchTermChange,
  limit,
  showToolbar = true,
  filterFn
}: Props) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const [win, setWin] = useState<MetricWindow>("1d");
  const { data, isLoading, isError } = useSymbols(win);
  const [, setFlashTick] = useState(0);
  const [localQuery, setLocalQuery] = useState("");

  const prevRef = useRef<Record<string, { price: number; volume: number; quoteVolume: number; change: number }>>({});
  const flashRef = useRef<
    Record<
      string,
      {
        priceDir?: number;
        priceUntil?: number;
        volumeUntil?: number;
        changeUntil?: number;
      }
    >
  >({});
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const now = Date.now();
    let nextTimerAt = 0;
    const prev = prevRef.current;
    const flash = flashRef.current;
    const nextPrev: typeof prev = {};
    let changed = false;

    for (const row of data) {
      const sym = row.symbol;
      const prevRow = prev[sym];

      if (prevRow) {
        if (row.price !== prevRow.price) {
          const dir = row.price > prevRow.price ? 1 : -1;
          flash[sym] = { ...flash[sym], priceDir: dir, priceUntil: now + PRICE_FLASH_MS };
          nextTimerAt = Math.max(nextTimerAt, now + PRICE_FLASH_MS);
          changed = true;
        }
        if (row.volume !== prevRow.volume || row.quoteVolume !== prevRow.quoteVolume) {
          flash[sym] = { ...flash[sym], volumeUntil: now + BLINK_MS };
          nextTimerAt = Math.max(nextTimerAt, now + BLINK_MS);
          changed = true;
        }
        if (row.change24h !== prevRow.change) {
          flash[sym] = { ...flash[sym], changeUntil: now + BLINK_MS };
          nextTimerAt = Math.max(nextTimerAt, now + BLINK_MS);
          changed = true;
        }
      }

      nextPrev[sym] = {
        price: row.price,
        volume: row.volume,
        quoteVolume: row.quoteVolume,
        change: row.change24h
      };
    }

    prevRef.current = nextPrev;

    if (changed) setFlashTick((v) => v + 1);

    if (nextTimerAt > 0) {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      const delay = Math.max(0, nextTimerAt - Date.now());
      flashTimerRef.current = window.setTimeout(() => {
        setFlashTick((v) => v + 1);
      }, delay + 20);
    }
  }, [data]);

  const sortKey = useSymbolsStore((s) => s.sortKey);
  const sortOrder = useSymbolsStore((s) => s.sortOrder);
  const setSortKey = useSymbolsStore((s) => s.setSortKey);
  const toggleSortOrder = useSymbolsStore((s) => s.toggleSortOrder);

  const query = typeof searchTerm === "string" ? searchTerm : localQuery;
  const handleQueryChange = (value: string) => {
    if (onSearchTermChange) onSearchTermChange(value);
    else setLocalQuery(value);
  };

  const filtered = useMemo(() => {
    const base = data ?? [];
    const prefiltered = filterFn ? base.filter(filterFn) : base;
    const q = query.trim().toUpperCase();
    if (!q) return prefiltered;
    return prefiltered.filter((row) => row.symbol.includes(q) || row.baseAsset.toUpperCase().includes(q));
  }, [data, query, filterFn]);

  const displayData = useMemo(() => {
    if (!limit || limit <= 0) return filtered;
    return filtered.slice(0, limit);
  }, [filtered, limit]);

  const columns = useMemo(() => {
    const wl = winLabel(win);

    return [
      columnHelper.accessor("symbol", {
        id: "symbol",
        header: () => t("table.symbol"),
        cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>
      }),

      columnHelper.accessor("price", {
        id: "price",
        header: () => t("table.price"),
        cell: (info) => {
          const value = info.getValue() as number;
          if (isLoading && (!value || value === 0)) return <LoadingBar />;
          const sym = info.row.original.symbol;
          const flash = flashRef.current[sym];
          const now = Date.now();
          let cls = "tabular-nums text-gray-900";
          if (flash?.priceUntil && flash.priceUntil > now) {
            cls += flash.priceDir && flash.priceDir > 0 ? " flash-price-up" : " flash-price-down";
          }
          return <span className={cls}>{fmtPrice(value, locale)}</span>;
        }
      }),

      columnHelper.accessor("volume", {
        id: "volume",
        header: () => `${wl} ${t("table.volume")}`,
        cell: (info) => {
          const value = info.getValue() as number;
          if (isLoading && (!value || value === 0)) return <LoadingBar />;
          const sym = info.row.original.symbol;
          const flash = flashRef.current[sym];
          const now = Date.now();
          const cls =
            flash?.volumeUntil && flash.volumeUntil > now ? "tabular-nums flash-blink" : "tabular-nums";
          const unit = info.row.original.baseAsset?.toUpperCase();
          return <span className={cls}>{fmtWithUnit(value, unit, locale)}</span>;
        }
      }),

      columnHelper.accessor((row) => row.quoteVolume, {
        id: "quoteVolume",
        header: () => `${wl} ${t("table.turnover")}`,
        cell: (info) => {
          const value = info.getValue() as number;
          if (isLoading && (!value || value === 0)) return <LoadingBar />;
          const sym = info.row.original.symbol;
          const flash = flashRef.current[sym];
          const now = Date.now();
          const cls =
            flash?.volumeUntil && flash.volumeUntil > now
              ? "tabular-nums text-gray-700 flash-blink"
              : "tabular-nums text-gray-700";
          const unit = (info.row.original.quoteAsset || "USDT").toUpperCase();
          return <span className={cls}>{fmtWithUnit(value, unit, locale)}</span>;
        }
      }),

      columnHelper.accessor("change24h", {
        id: "change24h",
        header: () => t("table.change", { tf: wl }),
        cell: (info) => {
          const value = info.getValue() as number;
          if (isLoading && (!value && value !== 0)) return <LoadingBar />;
          const isUp = value >= 0;
          const sym = info.row.original.symbol;
          const flash = flashRef.current[sym];
          const now = Date.now();
          const blink = flash?.changeUntil && flash.changeUntil > now ? " flash-blink" : "";
          return (
            <span className={`tabular-nums${blink} ${isUp ? "text-emerald-600" : "text-red-600"}`}>
              {value.toFixed(2)}%
            </span>
          );
        }
      }),

      columnHelper.accessor((row) => row.onboardDate, {
        id: "time",
        header: () => t("table.onboardDate"),
        cell: (info) => {
          const value = info.getValue() as number;
          if (!value || value <= 0) return <span className="text-xs text-gray-400">-</span>;
          return <span className="text-xs text-gray-500">{new Date(value).toLocaleDateString(locale)}</span>;
        }
      })
    ];
  }, [isLoading, win, t, locale]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: displayData ?? [],
    columns,
    getCoreRowModel: getCoreRowModel()
  });
  const rows = table.getRowModel().rows;
  const handleSort = (id: string) => {
    if (!SORTABLE.has(id)) return;

    const k = id as SortKey;
    if (k === sortKey) toggleSortOrder();
    else setSortKey(k);
  };

  const renderSortIcon = (id: string) => {
    if (!SORTABLE.has(id)) return null;
    if (id !== sortKey) return null;
    return sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />;
  };

  if (isLoading) {
    return <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">{t("table.loading")}</div>;
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        {t("table.error")}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
        {t("table.empty")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      {showToolbar ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{t("table.metricsWindow")}</span>
              <select
                className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                value={win}
                onChange={(e) => setWin(e.target.value as MetricWindow)}
              >
                {WIN_OPTS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder={t("common.searchSymbol")}
              className="w-40 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 focus:border-primary focus:outline-none"
            />
          </div>

          <span className="text-xs text-gray-400">{t("table.sortableHint")}</span>
        </div>
      ) : null}

      <div className="max-h-[560px] overflow-auto rounded-xl border border-gray-100">
        <table className="min-w-[860px] w-full table-auto text-left text-gray-900">
          <thead className="sticky top-0 z-10 bg-white">
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500"
              >
                {hg.headers.map((header) => {
                  const id = header.column.id;
                  const sortable = SORTABLE.has(id);

                  return (
                    <th
                      key={header.id}
                      className={`select-none px-3 py-2 ${sortable ? "cursor-pointer" : ""}`}
                      onClick={() => handleSort(id)}
                    >
                      <div className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {renderSortIcon(id)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-gray-200 transition hover:bg-primary/10"
                onClick={() => router.push(`/chart/${row.original.symbol}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit && filtered.length > limit ? (
        <p className="mt-3 text-xs text-gray-400">
          {t("table.limitNotice", { count: limit })}
        </p>
      ) : null}
    </div>
  );
}
