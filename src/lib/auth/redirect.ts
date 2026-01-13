const BLOCKED_PREFIXES = ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];

function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("://")) return false;
  return true;
}

export function resolveNextPath(search: string, fallback = "/market"): string {
  const params = new URLSearchParams(search || "");
  const next = params.get("next") || "";
  if (!next || !isSafeInternalPath(next)) return fallback;
  if (BLOCKED_PREFIXES.some((prefix) => next.startsWith(prefix))) return fallback;
  return next;
}
