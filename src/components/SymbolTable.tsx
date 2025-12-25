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
  return <span className="inline-block h-3 w-10 animate-pulse rounded bg-slate-700" />;
}

const SORTABLE: Set<string> = new Set(["symbol", "price", "volume", "change24h", "time"]);
const WIN_OPTS: MetricWindow[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M", "1Y"];

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
          flash[sym] = { ...flash[sym], priceDir: dir, priceUntil: now + 650 };
          nextTimerAt = Math.max(nextTimerAt, now + 650);
          changed = true;
        }
        if (row.volume !== prevRow.volume || row.quoteVolume !== prevRow.quoteVolume) {
          flash[sym] = { ...flash[sym], volumeUntil: now + 450 };
          nextTimerAt = Math.max(nextTimerAt, now + 450);
          changed = true;
        }
        if (row.change24h !== prevRow.change) {
          flash[sym] = { ...flash[sym], changeUntil: now + 450 };
          nextTimerAt = Math.max(nextTimerAt, now + 450);
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
        cell: (info) => <span className="font-medium text-slate-100">{info.getValue()}</span>
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
          let cls = "tabular-nums";
          if (flash?.priceUntil && flash.priceUntil > now) {
            cls += flash.priceDir && flash.priceDir > 0 ? " flash-price-up" : " flash-price-down";
          }
          return <span className={cls}>{fmtPrice(value)}</span>;
        }
      }),

      columnHelper.accessor("volume", {
        id: "volume",
        header: () => `${wl} Volume`,
        cell: (info) => {
          const value = info.getValue() as number;
          if (isLoading && (!value || value === 0)) return <LoadingBar />;
          const sym = info.row.original.symbol;
          const quoteVolume = info.row.original.quoteVolume;
          const flash = flashRef.current[sym];
          const now = Date.now();
          const cls =
            flash?.volumeUntil && flash.volumeUntil > now ? "tabular-nums flash-blink" : "tabular-nums";
          return (
            <div className={cls}>
              <div>
                <span className="text-[11px] text-slate-500">B </span>
                {fmtCompact(value)}
              </div>
              <div className="text-[11px] text-slate-500">
                Q {fmtCompact(quoteVolume)}
              </div>
            </div>
          );
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
            <span className={`tabular-nums${blink} ${isUp ? "text-emerald-400" : "text-red-400"}`}>
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
          if (!value || value <= 0) return <span className="text-xs text-slate-500">-</span>;
          return <span className="text-xs text-slate-400">{new Date(value).toLocaleDateString()}</span>;
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
    return <div className="rounded-lg bg-slate-900 p-4 text-sm text-slate-300">로딩 중...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-200">
        심볼 데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg bg-slate-900 p-4 text-sm text-slate-300">
        표시할 심볼이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-900/80 p-4 shadow-lg ring-1 ring-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Metrics window</span>
          <select
            className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200 ring-1 ring-slate-700"
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

        <span className="text-xs text-slate-400">정렬 가능한 열만 클릭됩니다.</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400"
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

          <tbody className="divide-y divide-slate-800 text-sm">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer hover:bg-slate-800/70"
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
