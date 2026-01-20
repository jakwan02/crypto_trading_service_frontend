import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type AdminKpi = {
  range: string;
  api_latency_p95_ms: number | null;
  api_latency_p99_ms: number | null;
  api_error_rate: number | null;
  ws_connections: number | null;
  ingest_lag_sec_by_market: Record<string, number> | null;
  retry_queue_sizes: { ingest_retry: Record<string, number> | null; stream_worker: Record<string, number> | null };
  alert_delivery_success_rate: number | null;
  db_errors_1h: number | null;
  redis_errors_1h: number | null;
  server_time: string;
};

export async function adminGetKpi(range: "1h" | "24h" | "7d"): Promise<AdminKpi> {
  return await apiRequest<AdminKpi>(`/admin/metrics/kpi?range=${encodeURIComponent(range)}`, { method: "GET", headers: requireAuthHeaders() });
}

