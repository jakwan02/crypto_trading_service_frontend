import type { ApiError } from "@/lib/appClient";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== "object") return null;
  return value as AnyRecord;
}

export function getErrRetryAfterSec(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const direct = (err as { retry_after?: unknown }).retry_after;
  const n = Number(direct);
  if (Number.isFinite(n) && n > 0) return n;
  const meta = getErrMeta(err);
  const metaN = meta && typeof meta.retry_after_sec !== "undefined" ? Number(meta.retry_after_sec) : NaN;
  return Number.isFinite(metaN) && metaN > 0 ? metaN : undefined;
}

export function getErrStatus(err: unknown): number | undefined {
  if (!err) return undefined;
  if (typeof err === "object" && "status" in err) {
    const n = Number((err as { status?: unknown }).status);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function getErrCode(err: unknown): string {
  if (!err) return "";
  if (typeof err === "object" && "code" in err) {
    const c = (err as ApiError).code;
    if (typeof c === "string") return c;
  }
  const rec = typeof err === "object" && err ? asRecord((err as ApiError).payload) : null;
  const code = rec && typeof rec.code === "string" ? rec.code : "";
  return code;
}

export function getErrMeta(err: unknown): AnyRecord | null {
  const rec = typeof err === "object" && err ? asRecord((err as ApiError).payload) : null;
  const meta = rec && typeof rec.meta === "object" && rec.meta ? (rec.meta as AnyRecord) : null;
  return meta;
}

export function isUnauthorized(err: unknown): boolean {
  return getErrStatus(err) === 401;
}

export function isConflict(err: unknown): boolean {
  return getErrStatus(err) === 409;
}

export function isRateLimited(err: unknown): boolean {
  return getErrStatus(err) === 429;
}
