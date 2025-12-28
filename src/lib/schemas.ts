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
    onboard_date: z.union([z.string(), z.number()]).optional(),
    onboardDate: z.union([z.string(), z.number()]).optional(),
    onboard_date_ms: z.number().optional()
  })
  .passthrough();

export const MetricItemSchema = z
  .object({
    symbol: z.string().optional(),
    market: z.string().optional(),
    tf: z.string().optional(),
    time: z.union([z.number(), z.string()]).optional(),
    bucket_start: z.union([z.number(), z.string()]).optional(),
    price: z.union([z.number(), z.string()]).optional(),
    open: z.union([z.number(), z.string()]).optional(),
    high: z.union([z.number(), z.string()]).optional(),
    low: z.union([z.number(), z.string()]).optional(),
    close: z.union([z.number(), z.string()]).optional(),
    volume: z.union([z.number(), z.string()]).optional(),
    volume_sum: z.union([z.number(), z.string()]).optional(),
    quote_volume: z.union([z.number(), z.string()]).optional(),
    quoteVolume: z.union([z.number(), z.string()]).optional(),
    prev_close: z.union([z.number(), z.string()]).optional(),
    change: z.union([z.number(), z.string()]).optional(),
    pct_change: z.union([z.number(), z.string()]).optional(),
    pctChange: z.union([z.number(), z.string()]).optional()
  })
  .passthrough();
