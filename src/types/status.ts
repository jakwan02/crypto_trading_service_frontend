export type StatusSummary = {
  server_time: string;
  ingest_lag_sec: number | null;
  components: Record<string, "ok" | "degraded" | "down">;
  open_incidents: Array<{
    id: string;
    component: string;
    severity: string;
    status: string;
    title: string;
    started_at: string;
    resolved_at: string | null;
    updated_at: string;
  }>;
  upcoming_maintenances: Array<{
    id: string;
    status: string;
    title: string;
    start_at: string;
    end_at: string | null;
    updated_at: string;
  }>;
};

export type StatusIncident = {
  id: string;
  component: string;
  severity: string;
  status: string;
  title: string;
  body_md: string;
  started_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StatusMaintenance = {
  id: string;
  status: string;
  title: string;
  body_md: string;
  start_at: string;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CursorPage<T> = { items: T[]; cursor_next?: string | null };

