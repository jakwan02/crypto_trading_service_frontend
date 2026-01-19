import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/legal/CookieBanner";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: "CoinDash",
  description: "실시간 암호화폐 시장 데이터와 차트를 제공하는 트레이딩 대시보드"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${manrope.variable} bg-white text-gray-900 font-sans`}>
        <AppProviders>
          <div className="relative flex min-h-screen flex-col bg-white text-gray-900">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            >
              <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute left-[-10%] top-[30%] h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute bottom-[-20%] right-[15%] h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
            </div>
            <Header />
            <div className="flex-1">{children}</div>
            <CookieBanner />
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
