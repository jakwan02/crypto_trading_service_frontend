// filename: frontend/app/chart/[symbol]/page.tsx
import SymbolChartClient from "./SymbolChartClient";

type ParamsObj = { symbol?: string };
type PageProps = { params?: ParamsObj | Promise<ParamsObj> };

async function unwrapParams(p: PageProps["params"]): Promise<ParamsObj> {
  if (!p) return {};
  const anyP = p as any;
  if (anyP && typeof anyP.then === "function") {
    return (await anyP) || {};
  }
  return (p as ParamsObj) || {};
}

export default async function SymbolChartPage({ params }: PageProps) {
  const p = await unwrapParams(params);
  const symbol = (p.symbol || "").trim();

  return <SymbolChartClient symbol={symbol} />;
}