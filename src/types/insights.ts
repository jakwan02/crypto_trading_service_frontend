export type BreadthWindow = "1h" | "4h" | "1d" | (string & {});
export type InsightMarket = "spot" | "um" | "cm" | (string & {});

export type BreadthLatestResponse = {
  market: InsightMarket;
  window: BreadthWindow;
  as_of_ts_ms: number;
  breadth: {
    adv: number;
    dec: number;
    adv_ratio: number;
    up_qv_share: number;
    median_ret: number;
    ret_p25: number;
    ret_p75: number;
    top10_qv_share: number;
    regime: string;
  };
};

export type BreadthHistoryItem = {
  time: number; // ms
  adv: number;
  dec: number;
  adv_ratio: number;
  up_qv_share: number;
  median_ret: number;
  ret_p25: number;
  ret_p75: number;
  top10_qv_share: number;
  regime: string;
};

export type BreadthHistoryResponse = {
  market: InsightMarket;
  window: BreadthWindow;
  days: number;
  items: BreadthHistoryItem[];
};

export type AnomalyKind = "volume" | "volatility" | "liquidity" | (string & {});
export type AnomalyWindow = "1h" | "4h" | "1d" | (string & {});

export type AnomalyItem = {
  symbol: string;
  kind: AnomalyKind;
  score: number;
  z: number;
  meta?: {
    pct_change?: number | null;
    quote_volume?: number | null;
  };
};

export type AnomaliesLatestResponse = {
  market: InsightMarket;
  window: AnomalyWindow;
  kind: AnomalyKind;
  as_of_ts_ms: number;
  items: AnomalyItem[];
};

