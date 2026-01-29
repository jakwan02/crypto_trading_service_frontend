export type StrategyMarket = "spot" | "um" | "cm" | (string & {});
export type StrategyTf = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | (string & {});

export type StrategyClause = {
  kind: "indicator" | "price" | (string & {});
  name: string;
  cmp: "gt" | "ge" | "lt" | "le" | (string & {});
  value: number;
};

export type StrategyExpr = {
  op: "and" | "or" | (string & {});
  clauses: StrategyClause[];
};

export type Strategy = {
  id: string;
  name: string;
  market: StrategyMarket;
  tf: StrategyTf;
  universe?: { type?: string; symbols?: string[] };
  entry?: StrategyExpr;
  exit?: StrategyExpr;
  created_at?: string;
  updated_at?: string;
};

export type StrategyListResponse = {
  items?: Array<Pick<Strategy, "id" | "name" | "market" | "tf" | "universe" | "created_at" | "updated_at">>;
};

export type StrategyCreateRequest = {
  name: string;
  market?: StrategyMarket;
  tf: StrategyTf;
  universe: { symbols: string[] };
  entry: StrategyExpr;
  exit: StrategyExpr;
};

export type StrategyRunCreateRequest = {
  days: number;
};

export type StrategyRunTrade = {
  symbol: string;
  entry_ts_ms: number;
  entry_price: number;
  exit_ts_ms?: number | null;
  exit_price?: number | null;
  pnl_pct?: number | null;
};

export type StrategyRun = {
  id: string;
  strategy_id: string;
  status: string;
  params?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  err?: string | null;
  created_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
  trades?: StrategyRunTrade[];
};

