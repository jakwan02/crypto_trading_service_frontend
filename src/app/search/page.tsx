import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

type SearchParams = { q?: string } | Promise<{ q?: string }>;

export default async function SearchPage({ searchParams }: { searchParams?: SearchParams }) {
  const resolved = await Promise.resolve(searchParams);
  const q = typeof resolved?.q === "string" ? resolved.q : "";
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-gray-500">Loading…</div>}>
      <SearchPageClient q={q} />
    </Suspense>
  );
}
