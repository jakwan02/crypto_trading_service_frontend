import { publicRequest } from "@/lib/publicClient";
import type { PublicPost, PublicPostsResponse } from "@/types/content";

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

