"use client";

import { useMemo, useState } from "react";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useAuth } from "@/contexts/AuthContext";

type AlertItem = {
  id: string;
  symbol: string;
  condition: string;
  value: string;
  window: string;
  enabled: boolean;
};

const INITIAL_ALERTS: AlertItem[] = [
  { id: "a1", symbol: "BTCUSDT", condition: "가격 상승", value: "5%", window: "1h", enabled: true },
  { id: "a2", symbol: "ETHUSDT", condition: "거래량 급증", value: "2배", window: "24h", enabled: true }
];

const MAX_FREE_ALERTS = 5;

export default function AlertsPage() {
  const { supported, permission, requestPermission } = useNotificationPermission();
  const { isPro } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [form, setForm] = useState({
    symbol: "BTCUSDT",
    condition: "가격 상승",
    value: "5%",
    window: "1h"
  });
  const [status, setStatus] = useState("");

  const canAdd = isPro || alerts.length < MAX_FREE_ALERTS;
  const permissionMessage = useMemo(() => {
    if (!supported) return "현재 브라우저에서는 웹 푸시 알림이 지원되지 않습니다.";
    if (permission === "granted") return "웹 푸시 알림이 활성화되어 있습니다.";
    if (permission === "denied") return "브라우저 알림이 차단되어 있습니다. 설정에서 권한을 허용해주세요.";
    return "중요한 시장 알림을 받으려면 웹 푸시 권한을 허용해주세요.";
  }, [permission, supported]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canAdd) {
      setStatus("무료 플랜은 최대 5개의 알림만 등록할 수 있습니다.");
      return;
    }
    const next: AlertItem = {
      id: `a-${Date.now()}`,
      symbol: form.symbol,
      condition: form.condition,
      value: form.value,
      window: form.window,
      enabled: true
    };
    setAlerts((prev) => [next, ...prev]);
    setStatus("알림이 등록되었습니다.");
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
          <p className="mt-1 text-sm text-gray-500">가격, 변동성, 뉴스 이벤트를 조건으로 알림을 설정하세요.</p>
        </header>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <p>{permissionMessage}</p>
          {supported && permission !== "granted" ? (
            <button
              type="button"
              onClick={() => requestPermission()}
              className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              알림 권한 요청
            </button>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-gray-900">새 알림 만들기</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-600">코인</label>
                <input
                  value={form.symbol}
                  onChange={(event) => setForm((prev) => ({ ...prev, symbol: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">조건</label>
                <select
                  value={form.condition}
                  onChange={(event) => setForm((prev) => ({ ...prev, condition: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                >
                  <option>가격 상승</option>
                  <option>가격 하락</option>
                  <option>변동률 급등</option>
                  <option>거래량 급증</option>
                  <option>뉴스 키워드</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">조건 값</label>
                <input
                  value={form.value}
                  onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">기간</label>
                <select
                  value={form.window}
                  onChange={(event) => setForm((prev) => ({ ...prev, window: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                >
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1d">1d</option>
                  <option value="1w">1w</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              알림 저장
            </button>
            {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}
          </form>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">알림 요약</h2>
            <p className="mt-2 text-xs text-gray-500">
              {isPro ? "Pro 회원은 무제한 알림을 등록할 수 있습니다." : `무료 플랜은 ${MAX_FREE_ALERTS}개까지 등록 가능합니다.`}
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              {alerts.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{item.symbol}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setAlerts((prev) =>
                          prev.map((alert) => (alert.id === item.id ? { ...alert, enabled: !alert.enabled } : alert))
                        )
                      }
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        item.enabled ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {item.enabled ? "ON" : "OFF"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {item.condition} · {item.value} · {item.window}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
