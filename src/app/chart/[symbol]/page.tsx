// filename: src/app/chart/[symbol]/page.tsx

import SymbolChartClient from "./SymbolChartClient";

type PageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function SymbolChartPage({ params }: PageProps) {
  // Next 16: params 는 Promise 이므로 await 로 언랩
  const { symbol } = await params;

  return <SymbolChartClient symbol={symbol} />;
}