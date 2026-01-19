import { publicRequest } from "@/lib/publicClient";
import type { SiteMetrics } from "@/types/site";

export async function getSiteMetrics(): Promise<SiteMetrics> {
  return await publicRequest<SiteMetrics>("/site/metrics", { method: "GET" });
}

