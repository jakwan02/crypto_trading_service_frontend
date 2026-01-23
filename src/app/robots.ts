import type { MetadataRoute } from "next";
import { headers } from "next/headers";

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = String(h.get("x-forwarded-proto") || "http").split(",")[0].trim() || "http";
  const host = String(h.get("x-forwarded-host") || h.get("host") || "localhost:3000").split(",")[0].trim();
  return `${proto}://${host}`;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/developer", "/referral", "/onboarding"]
    },
    sitemap: `${base}/sitemap.xml`
  };
}
