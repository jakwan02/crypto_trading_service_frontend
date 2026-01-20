import { publicRequest } from "@/lib/publicClient";
import type { PublicPost, PublicPostsResponse } from "@/types/content";

export type ContentRecommendationItem = {
  slug: string;
  title: string;
  summary?: string | null;
  published_at?: string | null;
  views_7d?: number;
};

export async function listRecommendations(params?: { limit?: number }): Promise<{ items: ContentRecommendationItem[] }> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  const tail = qs.toString();
  return await publicRequest<{ items: ContentRecommendationItem[] }>(`/content/recommendations${tail ? `?${tail}` : ""}`, { method: "GET" });
}

export async function trackPostView(params: { slug: string; anonId?: string | null }): Promise<{ ok: boolean; deduped?: boolean }> {
  const headers = new Headers();
  const anon = String(params.anonId || "").trim();
  if (anon) headers.set("X-Anon-Id", anon);
  headers.set("Content-Type", "application/json");
  return await publicRequest<{ ok: boolean; deduped?: boolean }>(`/content/view`, {
    method: "POST",
    headers,
    body: JSON.stringify({ slug: params.slug })
  });
}

export async function listPosts(params: {
  cursor?: string | null;
  limit?: number | null;
  category?: string | null;
  tag?: string | null;
  q?: string | null;
}): Promise<PublicPostsResponse> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.category) q.set("category", params.category);
  if (params.tag) q.set("tag", params.tag);
  if (params.q) q.set("q", params.q);
  const qs = q.toString();
  return await publicRequest<PublicPostsResponse>(`/posts${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function getPost(slug: string): Promise<PublicPost> {
  return await publicRequest<PublicPost>(`/posts/${encodeURIComponent(slug)}`, { method: "GET" });
}
