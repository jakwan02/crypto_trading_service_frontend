// filename: frontend/components/SymbolTable.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSymbols, type SymbolRow, type MetricWindow } from "@/hooks/useSymbols";
import { useSymbolsStore, SortKey } from "@/store/useSymbolStore";

const columnHelper = createColumnHelper<SymbolRow>();

function LoadingBar() {
  return <span className="inline-block h-3 w-10 animate-pulse rounded bg-gray-200" />;
}

const SORTABLE: Set<string> = new Set(["symbol", "price", "volume", "change24h", "time"]);
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

function fmtPrice(x: number): string {
  if (!Number.isFinite(x)) return "-";
  const frac = priceFrac(x);
  return x.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: frac
  });
}

function fmtCompact(x: number): string {
  if (!Number.isFinite(x)) return "-";
  const ax = Math.abs(x);
  if (ax === 0) return "0";
  if (ax >= 1_000_000_000_000) return (x / 1_000_000_000_000).toFixed(2) + "T";
  if (ax >= 1_000_000_000) return (x / 1_000_000_000).toFixed(2) + "B";
  if (ax >= 1_000_000) return (x / 1_000_000).toFixed(2) + "M";
  if (ax >= 1_000) return (x / 1_000).toFixed(2) + "K";
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function SymbolTable() {
  const router = useRouter();

  const [win, setWin] = useState<MetricWindow>("1d");
  const { data, isLoading, isError } = useSymbols(win);
  const [flashTick, setFlashTick] = useState(0);

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

  const columns = useMemo<ColumnDef<SymbolRow, any>[]>(() => {
    const wl = winLabel(win);

    return [
      columnHelper.accessor("symbol", {
        id: "symbol",
        header: () => "Symbol",
        cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>
      }),

      columnHelper.accessor("price", {
        id: "price",
        header: () => "Price",
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
          return <span className={cls}>{fmtPrice(value)}</span>;
        }
      }),

      columnHelper.accessor("volume", {
        id: "volume",
        header: () => `${wl} Volume (Base)`,
        cell: (info) => {
          const value = info.getValue() as number;
          if (isLoading && (!value || value === 0)) return <LoadingBar />;
          const sym = info.row.original.symbol;
          const flash = flashRef.current[sym];
          const now = Date.now();
          const cls =
            flash?.volumeUntil && flash.volumeUntil > now ? "tabular-nums flash-blink" : "tabular-nums";
          return <span className={cls}>{fmtCompact(value)}</span>;
        }
      }),

      columnHelper.accessor((row) => row.quoteVolume, {
        id: "turnover",
        header: () => `${wl} Turnover (Quote)`,
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
          return <span className={cls}>{fmtCompact(value)}</span>;
        }
      }),

      columnHelper.accessor("change24h", {
        id: "change24h",
        header: () => `${wl} Change`,
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
        header: () => "Onboard Date",
        cell: (info) => {
          const value = info.getValue() as number;
          if (!value || value <= 0) return <span className="text-xs text-gray-400">-</span>;
          return <span className="text-xs text-gray-500">{new Date(value).toLocaleDateString()}</span>;
        }
      })
    ];
  }, [isLoading, win, flashTick]);

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel()
  });

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
    return <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">로딩 중...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        심볼 데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
        표시할 심볼이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Metrics window</span>
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

        <span className="text-xs text-gray-400">정렬 가능한 열만 클릭됩니다.</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-gray-900">
          <thead>
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
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer transition hover:bg-blue-50/70"
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
    </div>
  );
}
