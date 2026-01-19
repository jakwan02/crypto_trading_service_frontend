"use client";

import { useCallback, useMemo } from "react";
import { Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { favoritesAdd, favoritesRemove, getFavorites } from "@/lib/watchlistsClient";

type Props = {
  market: string;
  symbol: string;
  className?: string;
};

type FavoritesState = {
  set: Set<string>;
};

function keyOf(market: string, symbol: string): string {
  return `${String(market || "spot").toLowerCase()}:${String(symbol || "").toUpperCase()}`;
}

async function fetchFavorites(): Promise<FavoritesState> {
  const res = await getFavorites();
  const set = new Set<string>();
  for (const it of res.items || []) {
    set.add(keyOf(String(it.market || "spot"), String(it.symbol || "")));
  }
  return { set };
}

export default function FavoriteStar({ market, symbol, className = "" }: Props) {
  const router = useRouter();
  const { user, sessionReady } = useAuth();
  const qc = useQueryClient();
  const favKey = useMemo(() => keyOf(market, symbol), [market, symbol]);

  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    enabled: Boolean(user)
  });

  const isFav = Boolean(query.data?.set.has(favKey));

  const addMutation = useMutation<unknown, unknown, void, { prev?: FavoritesState }>({
    mutationFn: () => favoritesAdd(String(symbol || "").toUpperCase(), String(market || "spot")),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["favorites"] });
      const prev = qc.getQueryData<FavoritesState>(["favorites"]);
      const nextSet = new Set<string>(prev?.set ? Array.from(prev.set) : []);
      nextSet.add(favKey);
      qc.setQueryData<FavoritesState>(["favorites"], { set: nextSet });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData<FavoritesState>(["favorites"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["favorites"] })
  });
  const removeMutation = useMutation<unknown, unknown, void, { prev?: FavoritesState }>({
    mutationFn: () => favoritesRemove(String(symbol || "").toUpperCase(), String(market || "spot")),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["favorites"] });
      const prev = qc.getQueryData<FavoritesState>(["favorites"]);
      const nextSet = new Set<string>(prev?.set ? Array.from(prev.set) : []);
      nextSet.delete(favKey);
      qc.setQueryData<FavoritesState>(["favorites"], { set: nextSet });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData<FavoritesState>(["favorites"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["favorites"] })
  });

  const toggle = useCallback(() => {
    if (!sessionReady) return;
    if (!user) {
      const next = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/";
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (addMutation.isPending || removeMutation.isPending) return;
    if (isFav) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  }, [addMutation, isFav, removeMutation, router, sessionReady, user]);

  const pending = addMutation.isPending || removeMutation.isPending;

  return (
    <button
      type="button"
      aria-label={isFav ? "Unfavorite" : "Favorite"}
      disabled={pending}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
      }}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
        isFav ? "border-primary/40 bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-500"
      } transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <Star className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
    </button>
  );
}
