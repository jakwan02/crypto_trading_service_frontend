"use client";

type BackoffOptions = {
  baseMs?: number;
  maxMs?: number;
  random?: () => number;
};

const DEFAULT_BASE_MS = 400;
const DEFAULT_MAX_MS = 8_000;

export function nextBackoff(attempt: number, options: BackoffOptions = {}): number {
  const baseMs = options.baseMs ?? DEFAULT_BASE_MS;
  const maxMs = options.maxMs ?? DEFAULT_MAX_MS;
  const random = options.random ?? Math.random;

  const exp = Math.min(Math.max(0, attempt), 6);
  const raw = Math.min(maxMs, baseMs * Math.pow(2, exp));
  const jitter = raw * (0.6 + random() * 0.8);
  return Math.round(jitter);
}
