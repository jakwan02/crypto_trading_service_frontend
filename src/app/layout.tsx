import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "Crypto Dashboard",
  description: "Binance spot/UM 심볼 정렬 + 실시간 차트 프론트엔드"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-950 text-slate-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}