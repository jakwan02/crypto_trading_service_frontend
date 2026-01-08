// 변경 이유: 번들 스냅샷(msgpack/JSON) fetch와 디코딩을 공통화
"use client";

import { decode, encode } from "@msgpack/msgpack";

export type ChartBundle = {
  market: string;
  symbol: string;
  now: number;
  items: Record<string, unknown[]>;
  temp?: Record<string, unknown>;
};

type FetchArgs = {
  apiBase: string;
  market: string;
  symbol: string;
  tf?: string;
  headers?: HeadersInit;
};

const MSGPACK_MIME = "application/x-msgpack";

function asBytes(buf: ArrayBuffer): Uint8Array {
  return new Uint8Array(buf);
}

export function decodeBundleBytes(bytes: Uint8Array | ArrayBuffer): ChartBundle {
  const raw = bytes instanceof Uint8Array ? bytes : asBytes(bytes);
  return decode(raw) as ChartBundle;
}

export async function fetchChartBundle(args: FetchArgs): Promise<{
  bundle: ChartBundle;
  bytes: Uint8Array;
  contentType: string;
}> {
  const { apiBase, market, symbol, tf, headers } = args;
  const url =
    `${apiBase}/chart/bundle` +
    `?market=${encodeURIComponent(market)}` +
    `&symbol=${encodeURIComponent(symbol)}` +
    (tf ? `&tf=${encodeURIComponent(tf)}` : "");
  const reqHeaders: HeadersInit = {
    Accept: MSGPACK_MIME,
    ...(headers || {})
  };

  const res = await fetch(url, { cache: "no-store", headers: reqHeaders });
  if (!res.ok) throw new Error(`bundle_http_${res.status}`);

  const contentType = String(res.headers.get("content-type") || "");
  if (contentType.includes(MSGPACK_MIME)) {
    const bytes = asBytes(await res.arrayBuffer());
    const bundle = decodeBundleBytes(bytes);
    return { bundle, bytes, contentType };
  }

  const bundle = (await res.json()) as ChartBundle;
  const bytes = encode(bundle);
  return { bundle, bytes, contentType };
}
