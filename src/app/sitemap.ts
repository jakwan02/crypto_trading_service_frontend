import type { MetadataRoute } from "next";
import { headers } from "next/headers";

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = String(h.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  const host = String(h.get("x-forwarded-host") || h.get("host") || "localhost:3000").split(",")[0].trim();
  return `${proto}://${host}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getBaseUrl();
  const now = new Date();
  const urls = [
    "/",
    "/pricing",
    "/status",
    "/changelog",
    "/support",
    "/terms",
    "/privacy",
    "/cookies",
    "/disclaimer",
    "/market",
    "/news",
    "/calendar",
    "/rankings"
  ];
  return urls.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.7
  }));
}
