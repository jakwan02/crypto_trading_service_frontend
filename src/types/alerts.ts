export type AlertMarket = "spot" | "um" | (string & {});
export type AlertWindow = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | (string & {});
export type AlertType = "price" | "pct" | "volume" | "indicator" | (string & {});
export type AlertOp = "gt" | "ge" | "lt" | "le" | "cross_up" | "cross_down" | (string & {});
export type AlertRepeat = "once" | "cooldown" | (string & {});
export type AlertIndName =
  | "rsi14"
  | "macd"
  | "macd_signal"
  | "macd_hist"
  | "bb_mid"
  | "bb_upper"
  | "bb_lower"
  | (string & {});

export type AlertChannels = {
  push?: boolean;
  email?: boolean;
  telegram?: boolean;
};

export type AlertRule = {
  id: string;
  market: AlertMarket;
  symbol: string;
  type: AlertType;
  window?: AlertWindow | null;
  op: AlertOp;
  value: number;
  ind_name?: AlertIndName | null;
  repeat: AlertRepeat;
  cooldown_sec?: number | null;
  channels: AlertChannels;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AlertRuleListResponse = {
  items?: AlertRule[];
};

export type AlertRuleCreateRequest = {
  market?: AlertMarket;
  symbol: string;
  type: AlertType;
  window?: AlertWindow | null;
  op: AlertOp;
  value: number;
  ind_name?: AlertIndName | null;
  repeat?: AlertRepeat;
  cooldown_sec?: number | null;
  channels: AlertChannels;
  is_active?: boolean;
};

export type AlertRuleCreateResponse = {
  id?: string;
};

export type AlertRulePatchRequest = Partial<Omit<AlertRule, "id" | "created_at" | "updated_at">>;

export type AlertEvent = {
  id: string;
  rule_id: string;
  market: AlertMarket;
  symbol: string;
  type: AlertType;
  window?: AlertWindow | null;
  trigger_value?: number | null;
  rule_value?: number | null;
  status?: string | null;
  channel?: string | null;
  err?: string | null;
  trigger_ts_ms?: number;
  created_at?: string;
  sent_at?: string | null;
  outcomes?: Array<{ horizon_sec: number; ret_pct?: number | null }>;
};

export type AlertEventListResponse = {
  items?: AlertEvent[];
  cursor_next?: string | null;
};
