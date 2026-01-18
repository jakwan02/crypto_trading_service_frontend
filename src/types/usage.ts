export type UsageMe = {
  plan?: string;
  limits?: {
    api?: {
      rpm?: number;
      calls_per_day?: number;
      rpm_used?: number;
    };
  };
  today?: {
    day?: string;
    api_calls?: number;
    limit?: number;
    calls_today?: number;
    calls_per_day?: number;
  };
  month?: {
    month?: string;
    api_calls?: number;
  };
};

