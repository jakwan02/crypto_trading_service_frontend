export type PortfolioMarket = "spot" | "um" | "cm" | (string & {});
export type PortfolioPosSide = "long" | "short" | (string & {});
export type PortfolioSide = "buy" | "sell" | (string & {});

export type PortfolioPosition = {
  market: PortfolioMarket;
  symbol: string;
  pos_side: PortfolioPosSide;
  qty_open: number;
  avg_entry?: number | null;
  mark?: number | null;
  realized_pnl_quote?: number | null;
  unrealized_pnl_quote?: number | null;
  fee_total_quote?: number | null;
  slip_total_quote?: number | null;
  funding_total_quote?: number | null;
  net_pnl_quote?: number | null;
  updated_at?: string;
};

export type PortfolioResponse = {
  base_ccy?: string;
  positions?: PortfolioPosition[];
  totals?: {
    realized_net_quote?: number;
    unrealized_quote?: number;
    net_quote?: number;
    exposure_quote?: number;
    leverage?: number | null;
  };
};

export type PortfolioTx = {
  id: string;
  ts?: string;
  market: PortfolioMarket;
  symbol: string;
  pos_side: PortfolioPosSide;
  action?: string;
  qty: number;
  price: number;
  leverage?: number | null;
  fee?: number | null;
  slip?: number | null;
  funding?: number | null;
  note?: string | null;
  created_at?: string;
};

export type PortfolioTxListResponse = {
  items?: PortfolioTx[];
  cursor_next?: string | null;
};

export type PortfolioTxCreateRequest = {
  ts?: string | null;
  market?: PortfolioMarket;
  symbol: string;
  pos_side?: PortfolioPosSide;
  side: PortfolioSide;
  qty: number;
  price: number;
  leverage?: number | null;
  fee?: number | null;
  slip?: number | null;
  funding?: number | null;
  note?: string | null;
};

export type PortfolioCashTx = {
  id: string;
  ts?: string;
  ccy: string;
  direction: "deposit" | "withdraw" | (string & {});
  amount: number;
  note?: string | null;
  created_at?: string;
};

export type PortfolioCashListResponse = {
  items?: PortfolioCashTx[];
  cursor_next?: string | null;
};

export type PortfolioCashCreateRequest = {
  ts?: string | null;
  ccy?: string;
  direction: "deposit" | "withdraw" | (string & {});
  amount: number;
  note?: string | null;
};

export type PortfolioPerfResponse = {
  base_ccy?: string;
  equity_curve?: Array<{ t: string; equity: number }>;
  pnl?: { realized_net_quote?: number; unrealized_quote?: number };
  risk?: { mdd?: number; volatility?: number; sharpe?: number; sortino?: number };
};

