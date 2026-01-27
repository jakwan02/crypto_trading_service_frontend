export type ScreenerMarket = "spot" | "um" | (string & {});
export type ScreenerWindow = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | (string & {});
export type ScreenerMetricField = "pct" | "qv" | "volume" | "price" | (string & {});
export type ScreenerOp = "gt" | "ge" | "lt" | "le" | (string & {});

export type ScreenerDslMetricCond = {
  k: "metric";
  field: ScreenerMetricField;
  window: ScreenerWindow;
  op: ScreenerOp;
  value: number;
};

export type ScreenerDslIndCond = {
  k: "ind";
  tf: ScreenerWindow;
  name: "rsi14" | "macd" | "macd_signal" | "macd_hist" | "bb_mid" | "bb_upper" | "bb_lower" | (string & {});
  op: ScreenerOp;
  value: number;
};

export type ScreenerDslBreakoutCond = {
  k: "breakout";
  tf: ScreenerWindow;
  n: 20;
  buf_pct: number;
};

export type ScreenerDslVolSpikeCond = {
  k: "vol_spike";
  tf: ScreenerWindow;
  n: 20;
  ratio: number;
  min_vol_sma?: number;
};

export type ScreenerDslCond =
  | ScreenerDslMetricCond
  | ScreenerDslIndCond
  | ScreenerDslBreakoutCond
  | ScreenerDslVolSpikeCond;

export type ScreenerDslV1 = {
  v: 1;
  market: ScreenerMarket;
  universe: { top_by: ScreenerMetricField; window: ScreenerWindow; limit: number };
  op: "and" | "or";
  conds: ScreenerDslCond[];
  sort: { by: ScreenerMetricField; window: ScreenerWindow; dir: "asc" | "desc" };
  limit?: number;
};

export type ScreenerRunRequest = {
  dsl: ScreenerDslV1;
  cursor?: string | null;
  limit?: number | null;
};

export type ScreenerRunResponse = {
  items?: Array<{
    symbol: string;
    market: ScreenerMarket;
    metrics?: Record<string, { price?: number | null; pct?: number | null; qv?: number | null; volume?: number | null }>;
    ind?: Record<string, Record<string, number | null>>;
  }>;
  cursor_next?: string | null;
  meta?: { t_server_ms?: number };
};

export type SavedScreener = {
  id: string;
  name: string;
  market: ScreenerMarket;
  dsl: ScreenerDslV1;
  created_at?: string;
  updated_at?: string;
};

export type SavedScreenerListResponse = {
  items?: SavedScreener[];
};

export type SavedScreenerCreateRequest = {
  name: string;
  market?: ScreenerMarket;
  dsl: ScreenerDslV1;
};

export type SavedScreenerCreateResponse = {
  id?: string;
};
