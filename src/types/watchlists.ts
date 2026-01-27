export type WatchlistMarket = "spot" | "um" | (string & {});

export type WatchlistItem = {
  market: WatchlistMarket;
  symbol: string;
  created_at?: string;
};

export type Watchlist = {
  id: string;
  name: string;
  tags?: string[];
  is_default?: boolean;
  is_public?: boolean;
  share_token?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: WatchlistItem[];
};

export type WatchlistsResponse = {
  items?: Watchlist[];
};

export type WatchlistCreateRequest = {
  name: string;
  tags?: string[];
  is_public?: boolean;
};

export type WatchlistCreateResponse = {
  id?: string;
};

export type WatchlistUpdateRequest = {
  name?: string;
  tags?: string[];
  is_public?: boolean;
};

export type WatchlistShareResponse = {
  share_token?: string;
};

export type PublicSharedWatchlistResponse = {
  items?: Array<{ market?: string; symbol?: string }>;
  symbols?: string[];
};

export type NormalizedSharedWatchlist = {
  items: Array<{ market: WatchlistMarket; symbol: string }>;
};
