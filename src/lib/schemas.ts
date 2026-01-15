import { z } from "zod";

export const SymbolItemSchema = z
  .object({
    market: z.string().optional(),
    symbol: z.string().optional(),
    status: z.string().optional(),
    base_asset: z.string().optional(),
    baseAsset: z.string().optional(),
    quote_asset: z.string().optional(),
    quoteAsset: z.string().optional(),
    // 변경 이유: onboard_date가 null인 심볼도 파싱해 WS 연결이 막히지 않도록 허용
    onboard_date: z.union([z.string(), z.number(), z.null()]).optional(),
    onboardDate: z.union([z.string(), z.number(), z.null()]).optional(),
    onboard_date_ms: z.number().optional()
  })
  .passthrough();

export const MetricItemSchema = z
  // 변경 이유: metrics/tickers에서 prev_close/change/pct_change 등이 null일 수 있어, 배열 전체 Zod 파싱 실패로 화면이 비는 문제 방지
  .object({
    symbol: z.string().optional(),
    market: z.string().optional(),
    tf: z.string().optional(),
    time: z.union([z.number(), z.string(), z.null()]).optional(),
    bucket_start: z.union([z.number(), z.string(), z.null()]).optional(),
    price: z.union([z.number(), z.string(), z.null()]).optional(),
    open: z.union([z.number(), z.string(), z.null()]).optional(),
    high: z.union([z.number(), z.string(), z.null()]).optional(),
    low: z.union([z.number(), z.string(), z.null()]).optional(),
    close: z.union([z.number(), z.string(), z.null()]).optional(),
    volume: z.union([z.number(), z.string(), z.null()]).optional(),
    volume_sum: z.union([z.number(), z.string(), z.null()]).optional(),
    quote_volume: z.union([z.number(), z.string(), z.null()]).optional(),
    quoteVolume: z.union([z.number(), z.string(), z.null()]).optional(),
    prev_close: z.union([z.number(), z.string(), z.null()]).optional(),
    change: z.union([z.number(), z.string(), z.null()]).optional(),
    pct_change: z.union([z.number(), z.string(), z.null()]).optional(),
    pctChange: z.union([z.number(), z.string(), z.null()]).optional()
  })
  .passthrough();
