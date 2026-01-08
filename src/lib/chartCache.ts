// 변경 이유: 번들 스냅샷 2계층 캐시(메모리 LRU + IndexedDB)와 탭 간 동기화를 제공
"use client";

export type CachedCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MemoryBundle = {
  savedAt: number;
  dataByTf: Record<string, CachedCandle[]>;
  tempByTf?: Record<string, CachedCandle | null>;
};

type BundleRecord = {
  key: string;
  savedAt: number;
  accessedAt: number;
  data: ArrayBuffer;
};

type BundleReadyMessage = {
  type: "bundle_ready";
  key: string;
  savedAt: number;
};

const MEM_MAX = 5;
const IDB_MAX = 50;
const DB_NAME = "chart_bundle_cache";
const STORE = "bundle";
const BC_NAME = "chart_bundle";

const memCache = new Map<string, MemoryBundle>();
let dbPromise: Promise<IDBDatabase> | null = null;
let bc: BroadcastChannel | null = null;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!bc) bc = new BroadcastChannel(BC_NAME);
  return bc;
}

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
  const all = (await reqDone(store.getAll())) as BundleRecord[];
  if (all.length <= maxEntries) {
    await txDone(tx);
    return;
  }
  all.sort((a, b) => (a.accessedAt || 0) - (b.accessedAt || 0));
  const remove = all.slice(0, all.length - maxEntries);
  for (const row of remove) {
    store.delete(row.key);
  }
  await txDone(tx);
}

export function getMemoryBundle(key: string): MemoryBundle | null {
  const hit = memCache.get(key);
  if (!hit) return null;
  memCache.delete(key);
  memCache.set(key, hit);
  return hit;
}

export function setMemoryBundle(
  key: string,
  dataByTf: Record<string, CachedCandle[]>,
  tempByTf: Record<string, CachedCandle | null> | undefined,
  savedAt: number
): void {
  if (memCache.has(key)) memCache.delete(key);
  memCache.set(key, { savedAt, dataByTf, tempByTf });
  while (memCache.size > MEM_MAX) {
    const oldestKey = memCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    memCache.delete(oldestKey);
  }
}

export async function getIdbBundleBytes(
  key: string
): Promise<{ savedAt: number; data: Uint8Array } | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const row = (await reqDone(store.get(key))) as BundleRecord | undefined;
    if (!row || !row.data) {
      await txDone(tx);
      return null;
    }
    row.accessedAt = Date.now();
    store.put(row);
    await txDone(tx);
    return { savedAt: row.savedAt, data: new Uint8Array(row.data) };
  } catch {
    return null;
  }
}

export async function putIdbBundleBytes(
  key: string,
  bytes: Uint8Array,
  savedAt: number
): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const row: BundleRecord = {
      key,
      savedAt,
      accessedAt: Date.now(),
      data: toArrayBuffer(bytes)
    };
    store.put(row);
    await txDone(tx);
    await pruneIdb(IDB_MAX);
  } catch {}
}

export function broadcastBundleReady(key: string, savedAt: number): void {
  const channel = getBroadcastChannel();
  if (!channel) return;
  const msg: BundleReadyMessage = { type: "bundle_ready", key, savedAt };
  channel.postMessage(msg);
}

export function onBundleReady(handler: (msg: BundleReadyMessage) => void): () => void {
  const channel = getBroadcastChannel();
  if (!channel) return () => {};
  const listener = (ev: MessageEvent) => {
    const msg = ev.data as BundleReadyMessage;
    if (!msg || msg.type !== "bundle_ready") return;
    handler(msg);
  };
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}
