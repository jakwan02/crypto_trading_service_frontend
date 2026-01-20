// 변경 이유: Week6 공유 링크 최적화를 위해 기본 OG 이미지를 생성(Next App Router)

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              background: "#f59e0b",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18
            }}
          >
            CD
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>CoinDash</div>
            <div style={{ fontSize: 16, color: "#6b7280" }}>AI crypto intelligence</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
            Real-time crypto charts
          </div>
          <div style={{ marginTop: 16, fontSize: 22, color: "#374151" }}>
            Market · Screener · Alerts · Portfolio · Research
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", fontSize: 16 }}>
          <div>coindash</div>
          <div>Week6</div>
        </div>
      </div>
    ),
    size
  );
}

