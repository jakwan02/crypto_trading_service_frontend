"use client";

// 변경 이유: Week6 전환/온보딩 이벤트 측정을 위해 /app/analytics/event 호출 클라이언트 추가(실패는 UX에 영향 없게 무시)

import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

export async function trackEvent(name: string, props: Record<string, unknown> = {}, options?: { sampleRate?: number }): Promise<void> {
  const token = getAcc();
  if (!token) return;
  const safeName = String(name || "").trim();
  if (!safeName) return;

  try {
    await apiRequest<{ ok: boolean }>("/analytics/event", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      json: { name: safeName, props, sample_rate: options?.sampleRate }
    });
  } catch {
    // ignore
  }
}

