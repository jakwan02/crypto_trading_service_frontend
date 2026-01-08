// filename: frontend/components/SymbolTable.tsx
// 변경 이유: market 페이지 전용 부트스트랩/가시영역 WS 구독/가상 스크롤 적용
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { observeElementOffset, useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMarketSymbols, type MarketRow } from "@/hooks/useMarketSymbols";
import { formatCompactNumber } from "@/lib/format";
import { useSymbolsStore, type SortKey } from "@/store/useSymbolStore";

const columnHelper = createColumnHelper<MarketRow>();

type Props = {
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  limit?: number;
  showToolbar?: boolean;
  filterFn?: (row: MarketRow) => boolean;
};

function LoadingBar() {
  return <span className="inline-block h-3 w-10 animate-pulse rounded bg-gray-200" />;
}

type MetricWindow = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M" | "1Y";
type MarketState = {
  win: MetricWindow;
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  query: string;
  scrollTop: number;
};
const SORTABLE: Set<string> = new Set(["symbol", "price", "volume", "quoteVolume", "change24h", "time"]);
const WIN_OPTS: MetricWindow[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M", "1Y"];
const PRICE_FLASH_MS = 520;
const BLINK_MS = 320;
const VIRTUAL_OVERSCAN = 20;
const ROW_ESTIMATE = 40;
const SKELETON_ROWS = 12;
// 변경 이유: 헤더/바디에 동일한 grid 템플릿을 적용해 컬럼 정렬을 고정
const GRID_TEMPLATE =
  "minmax(140px, 18%) minmax(120px, 15%) minmax(150px, 17%) minmax(180px, 20%) minmax(120px, 12%) minmax(120px, 18%)";

// 변경 이유: 스크롤 중 flushSync 경고를 피하기 위해 isScrolling=false로 고정
const observeOffsetNoSync: typeof observeElementOffset = (instance, cb) =>
  observeElementOffset(instance, (offset) => cb(offset, false));

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

function fmtPrice(x: number | null, locale: string): string {
  if (x === null || !Number.isFinite(x)) return "-";
  const frac = priceFrac(x);
  return x.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: frac
  });
}

function fmtWithUnit(value: number | null, unit: string | undefined, locale: string): string {
  const base = formatCompactNumber(value ?? NaN, locale);
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
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);

  const [win, setWin] = useState<MetricWindow>("1d");
  const [localQuery, setLocalQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("quoteVolume");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { order, rowMap, cursorNext, isLoading, isError, isLoadingMore, hasMore, loadMore, setVisibleSymbols } =
    useMarketSymbols(win, { sortKey, sortOrder, query: searchTerm ?? localQuery });
  const [, setFlashTick] = useState(0);

  const prevRef = useRef<
    Record<string, { price: number | null; volume: number | null; quoteVolume: number | null; change: number | null }>
  >({});
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
  const rowMapRef = useRef<Record<string, MarketRow>>({});
  const visibleRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const loadTriggerRef = useRef<string>("");
  const loadAttemptRef = useRef<{ rowsLen: number; cursor: number | null } | null>(null);
  const prevOrderLenRef = useRef(0);
  const marketStateRef = useRef<Record<string, MarketState>>({});
  const prevMarketRef = useRef<string | null>(null);
  const pendingScrollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    rowMapRef.current = rowMap;
  }, [rowMap]);

  useEffect(() => {
    // 변경 이유: SPA 이동 후 order 리셋 시 loadMore 트리거 고정 해제
    if (order.length < prevOrderLenRef.current) {
      loadTriggerRef.current = "";
      loadAttemptRef.current = null;
    }
    prevOrderLenRef.current = order.length;
  }, [order.length]);

  // 변경 이유: 실시간 rowMap 변경에도 플래시 반응
  useEffect(() => {
    if (!order.length) return;
    const now = Date.now();
    let nextTimerAt = 0;
    const prev = prevRef.current;
    const flash = flashRef.current;
    const nextPrev: typeof prev = {};
    let changed = false;

    for (const sym of order) {
      const row = rowMapRef.current[sym];
      if (!row) continue;
      const prevRow = prev[sym];

      if (prevRow) {
        if (row.price !== null && prevRow.price !== null && row.price !== prevRow.price) {
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
  }, [order, rowMap]);

  const query = typeof searchTerm === "string" ? searchTerm : localQuery;
  const handleQueryChange = (value: string) => {
    if (onSearchTermChange) onSearchTermChange(value);
    else setLocalQuery(value);
  };

  useEffect(() => {
    const prev = prevMarketRef.current;
    if (prev && prev !== market) {
      // 변경 이유: 시장별 상태(정렬/필터/스크롤)를 분리 저장
      marketStateRef.current[prev] = {
        win,
        sortKey,
        sortOrder,
        query,
        scrollTop: parentRef.current?.scrollTop ?? 0
      };
    }

    const saved = marketStateRef.current[market];
    if (saved) {
      if (saved.win !== win) setWin(saved.win);
      if (saved.sortKey !== sortKey) setSortKey(saved.sortKey);
      if (saved.sortOrder !== sortOrder) setSortOrder(saved.sortOrder);
      if (typeof searchTerm !== "string" && saved.query !== localQuery) setLocalQuery(saved.query);
      pendingScrollRef.current = saved.scrollTop ?? 0;
    } else if (prev && prev !== market) {
      pendingScrollRef.current = 0;
    }

    prevMarketRef.current = market;
    loadTriggerRef.current = "";
    loadAttemptRef.current = null;
  }, [market]);

  const filteredOrder = useMemo(() => {
    if (!filterFn) return order;
    const out: string[] = [];
    for (const sym of order) {
      const row = rowMap[sym];
      if (!row) continue;
      if (filterFn && !filterFn(row)) continue;
      out.push(sym);
    }
    return out;
  }, [filterFn, order, rowMap]);

  const displayData = useMemo(() => {
    const orderList = !limit || limit <= 0 ? filteredOrder : filteredOrder.slice(0, limit);
    return orderList.map((sym) => rowMap[sym]).filter(Boolean);
  }, [filteredOrder, limit, rowMap]);
  const isInitialLoading = isLoading && displayData.length === 0;
  const skeletonRows = useMemo(
    () =>
      Array.from({ length: SKELETON_ROWS }, (_, idx) => ({
        market,
        symbol: `__loading__${idx}`,
        status: "",
        baseAsset: "",
        quoteAsset: "",
        onboardDate: null,
        price: null,
        volume: null,
        quoteVolume: null,
        change24h: null,
        time: null
      })),
    [market]
  );
  const tableData = isInitialLoading ? skeletonRows : displayData;

  const columns = useMemo(() => {
    const wl = winLabel(win);

    return [
      columnHelper.accessor("symbol", {
        id: "symbol",
        header: () => t("table.symbol"),
        cell: (info) => {
          const value = String(info.getValue() ?? "");
          if (isLoading && value.startsWith("__loading__")) return <LoadingBar />;
          return <span className="font-medium text-gray-900">{value}</span>;
        }
      }),

      columnHelper.accessor("price", {
        id: "price",
        header: () => t("table.price"),
        cell: (info) => {
          const value = info.getValue() as number | null;
          if (value === null || value === undefined) {
            return isLoading ? <LoadingBar /> : <span className="text-xs text-gray-400">-</span>;
          }
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
          const value = info.getValue() as number | null;
          if (value === null || value === undefined) {
            return isLoading ? <LoadingBar /> : <span className="text-xs text-gray-400">-</span>;
          }
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
          const value = info.getValue() as number | null;
          if (value === null || value === undefined) {
            return isLoading ? <LoadingBar /> : <span className="text-xs text-gray-400">-</span>;
          }
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
          const value = info.getValue() as number | null;
          if (value === null || value === undefined) {
            return isLoading ? <LoadingBar /> : <span className="text-xs text-gray-400">-</span>;
          }
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
          const value = info.getValue() as number | null;
          if (isLoading && (!value || value <= 0)) return <LoadingBar />;
          if (!value || value <= 0) return <span className="text-xs text-gray-400">-</span>;
          return <span className="text-xs text-gray-500">{new Date(value).toLocaleDateString(locale)}</span>;
        }
      })
    ];
  }, [isLoading, win, t, locale]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableData ?? [],
    columns,
    getCoreRowModel: getCoreRowModel()
  });
  const rows = table.getRowModel().rows;
  const parentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE,
    observeElementOffset: observeOffsetNoSync,
    overscan: VIRTUAL_OVERSCAN
  });
  const virtualRows = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!displayData.length) return;
    // 변경 이유: 가시 영역 계산이 지연될 때 첫 측정을 강제
    rowVirtualizer.measure();
  }, [displayData.length, rowVirtualizer]);

  useEffect(() => {
    if (pendingScrollRef.current === null) return;
    const root = parentRef.current;
    if (!root) return;
    // 변경 이유: 시장 전환 시 저장된 스크롤 위치 복원
    const nextTop = pendingScrollRef.current;
    pendingScrollRef.current = null;
    root.scrollTop = nextTop;
    rowVirtualizer.scrollToOffset(nextTop);
  }, [displayData.length, market, rowVirtualizer]);

  const handleSort = (id: string) => {
    if (!SORTABLE.has(id)) return;
    const k = id as SortKey;
    if (k === sortKey) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else setSortKey(k);
  };

  const renderSortIcon = (id: string) => {
    if (!SORTABLE.has(id)) return null;
    if (id !== sortKey) return null;
    return sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />;
  };

  useEffect(() => {
    if (!virtualRows.length) return;
    visibleRangeRef.current = {
      start: virtualRows[0].index,
      end: virtualRows[virtualRows.length - 1].index
    };
  }, [virtualRows]);

  // 변경 이유: 페이지 이동 후에도 증분 로딩 트리거를 안정적으로 보장
  const requestLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    const triggerKey = `more:${rows.length}`;
    if (loadTriggerRef.current === triggerKey) return;
    loadTriggerRef.current = triggerKey;
    loadAttemptRef.current = { rowsLen: rows.length, cursor: cursorNext ?? null };
    loadMore();
  }, [cursorNext, hasMore, isLoadingMore, loadMore, rows.length]);

  // 변경 이유: loadMore 실패 시 동일 길이에서도 재시도 허용
  useEffect(() => {
    if (isLoadingMore) return;
    const attempt = loadAttemptRef.current;
    if (!attempt) return;
    if (attempt.rowsLen === rows.length && attempt.cursor === (cursorNext ?? null)) {
      loadTriggerRef.current = "";
    }
    loadAttemptRef.current = null;
  }, [cursorNext, isLoadingMore, rows.length]);

  useEffect(() => {
    if (!virtualRows.length) return;
    const lastIndex = virtualRows[virtualRows.length - 1].index;
    const threshold = Math.floor(rows.length * 0.7);
    if (lastIndex >= threshold) requestLoadMore();
  }, [requestLoadMore, rows.length, virtualRows]);

  useEffect(() => {
    const root = parentRef.current;
    const target = bottomRef.current;
    if (!root || !target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) requestLoadMore();
      },
      { root, rootMargin: "200px 0px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [requestLoadMore]);


  useEffect(() => {
    if (!displayData.length) {
      if (!isLoading) setVisibleSymbols([]);
      return;
    }
    if (!virtualRows.length) {
      // 변경 이유: 가상 스크롤 계산 전에도 ws_rt 구독을 유지
      const fallback = displayData.slice(0, Math.min(displayData.length, 40)).map((row) => row.symbol);
      setVisibleSymbols(fallback);
      return;
    }
    const start = virtualRows[0].index;
    const end = virtualRows[virtualRows.length - 1].index;
    const symbols = displayData.slice(start, end + 1).map((row) => row.symbol);
    setVisibleSymbols(symbols);
  }, [displayData, isLoading, setVisibleSymbols, virtualRows]);

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        {t("table.error")}
      </div>
    );
  }

  if (!isInitialLoading && (!rows || rows.length === 0)) {
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

      <div
        ref={parentRef}
        className="max-h-[560px] overflow-auto rounded-xl border border-gray-100"
        style={{ overscrollBehavior: "contain" }}
        onWheel={(event) => {
          const root = parentRef.current;
          if (!root) return;
          const atTop = root.scrollTop <= 0;
          const atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 1;
          if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
            event.preventDefault();
          }
        }}
      >
        <table className="min-w-[1000px] w-full table-fixed border-collapse border-spacing-0 text-left text-gray-900">
          <thead className="sticky top-0 z-10 bg-white">
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500"
                style={{ display: "grid", gridTemplateColumns: GRID_TEMPLATE }}
              >
                {hg.headers.map((header) => {
                  const id = header.column.id;
                  const sortable = SORTABLE.has(id);

                  return (
                    <th
                      key={header.id}
                      className={`select-none px-3 py-2 whitespace-nowrap ${sortable ? "cursor-pointer" : ""}`}
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

          <tbody
            className="text-sm"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
              display: "block",
              width: "100%"
            }}
          >
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              return (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-gray-200 transition hover:bg-primary/10"
                  style={{
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: "grid",
                    gridTemplateColumns: GRID_TEMPLATE,
                    width: "100%"
                  }}
                  onClick={() => {
                    // 변경 이유: 차트 진입 전 market store 동기화
                    const nextMarket = String(row.original.market || "").trim().toLowerCase();
                    if (nextMarket === "spot" || nextMarket === "um") {
                      setMarket(nextMarket as "spot" | "um");
                    }
                    router.push(`/chart/${row.original.symbol}?market=${encodeURIComponent(row.original.market)}`);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 truncate">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {isLoadingMore ? (
          <div className="py-2 text-center text-xs text-gray-400">{t("table.loading")}</div>
        ) : null}
        <div ref={bottomRef} className="h-1" />
      </div>
      {limit && filteredOrder.length > limit ? (
        <p className="mt-3 text-xs text-gray-400">
          {t("table.limitNotice", { count: limit })}
        </p>
      ) : null}
    </div>
  );
}
