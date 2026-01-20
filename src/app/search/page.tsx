import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-gray-500">Loading…</div>}>
      <SearchPageClient q={q} />
    </Suspense>
  );
}

