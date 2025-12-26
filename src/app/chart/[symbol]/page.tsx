// filename: frontend/app/chart/[symbol]/page.tsx
import SymbolChartClient from "./SymbolChartClient";

type ParamsObj = { symbol?: string };
type PageProps = { params?: ParamsObj | Promise<ParamsObj> };

async function unwrapParams(p: PageProps["params"]): Promise<ParamsObj> {
  if (!p) return {};
  const maybePromise = p as { then?: unknown } | undefined;
  if (maybePromise && typeof maybePromise.then === "function") {
    return (await (p as Promise<ParamsObj>)) || {};
  }
  return (p as ParamsObj) || {};
}

export default async function SymbolChartPage({ params }: PageProps) {
  const p = await unwrapParams(params);
  const symbol = (p.symbol || "").trim();

  return <SymbolChartClient symbol={symbol} />;
}
