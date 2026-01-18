import SharedWatchlistClient from "./sharedWatchlistClient";

type ParamsObj = { token?: string };
type PageProps = { params?: ParamsObj | Promise<ParamsObj> };

async function unwrapParams(p: PageProps["params"]): Promise<ParamsObj> {
  if (!p) return {};
  const maybePromise = p as { then?: unknown } | undefined;
  if (maybePromise && typeof maybePromise.then === "function") {
    return (await (p as Promise<ParamsObj>)) || {};
  }
  return (p as ParamsObj) || {};
}

export default async function SharedWatchlistPage({ params }: PageProps) {
  const p = await unwrapParams(params);
  const token = String(p.token || "").trim();
  return <SharedWatchlistClient token={token} />;
}

