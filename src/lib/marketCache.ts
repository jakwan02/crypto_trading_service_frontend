// 변경 이유: Market Overview 증분 로딩 캐시(메모리 LRU + IndexedDB) 제공
"use client";

import type { MarketRow } from "@/hooks/useMarketSymbols";

export type MarketCacheEntry = {
  savedAt: number;
  order: string[];
  rowMap: Record<string, MarketRow>;
  cursorNext: number | null;
  loadedCount: number;
};

type MarketCacheRecord = {
  key: string;
  savedAt: number;
  accessedAt: number;
  payload: MarketCacheEntry;
};

const MEM_MAX = 5;
const IDB_MAX = 30;
const DB_NAME = "market_overview_cache";
const STORE = "market";

const memCache = new Map<string, MarketCacheEntry>();
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("indexeddb_unavailable"));
  }
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("accessedAt", "accessedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function reqDone<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function pruneIdb(maxEntries: number): Promise<void> {
  if (maxEntries <= 0) return;
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const all = (await reqDone(store.getAll())) as MarketCacheRecord[];
  if (all.length <= maxEntries) {
    await txDone(tx);
    return;
  }
  all.sort((a, b) => (a.accessedAt || 0) - (b.accessedAt || 0));
  const remove = all.slice(0, all.length - maxEntries);
  for (const row of remove) store.delete(row.key);
  await txDone(tx);
}

export function getMemoryMarketCache(key: string): MarketCacheEntry | null {
  const hit = memCache.get(key);
  if (!hit) return null;
  memCache.delete(key);
  memCache.set(key, hit);
  return hit;
}

export function setMemoryMarketCache(key: string, entry: MarketCacheEntry): void {
  if (memCache.has(key)) memCache.delete(key);
  memCache.set(key, entry);
  while (memCache.size > MEM_MAX) {
    const oldestKey = memCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    memCache.delete(oldestKey);
  }
}

export async function getIdbMarketCache(key: string): Promise<MarketCacheEntry | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const row = (await reqDone(store.get(key))) as MarketCacheRecord | undefined;
    if (!row || !row.payload) {
      await txDone(tx);
      return null;
    }
    row.accessedAt = Date.now();
    store.put(row);
    await txDone(tx);
    return row.payload;
  } catch {
    return null;
  }
}

export async function putIdbMarketCache(key: string, entry: MarketCacheEntry): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const row: MarketCacheRecord = {
      key,
      savedAt: entry.savedAt,
      accessedAt: Date.now(),
      payload: entry
    };
    store.put(row);
    await txDone(tx);
    await pruneIdb(IDB_MAX);
  } catch {}
}
