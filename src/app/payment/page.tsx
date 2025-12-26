"use client";

import { useMemo, useState } from "react";

const METHOD_LABELS: Record<string, string> = {
  card: "신용카드",
  bank: "계좌이체",
  crypto: "암호화폐 지갑"
};

export default function PaymentPage() {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("card");
  const [status, setStatus] = useState<string>("");

  const numericAmount = useMemo(() => Number(amount), [amount]);
  const fee = useMemo(() => (Number.isFinite(numericAmount) ? numericAmount * 0.015 : 0), [numericAmount]);
  const total = useMemo(() => (Number.isFinite(numericAmount) ? numericAmount + fee : 0), [numericAmount, fee]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    console.log("payment_submit", payload);
    setStatus("결제 요청이 전송되었습니다. 승인 결과를 확인해주세요.");
  };

  const formatMoney = (value: number) =>
    Number.isFinite(value) && value > 0 ? value.toLocaleString() : "-";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Payment</h1>
          <p className="mt-1 text-sm text-gray-500">
            잔액이 부족할 때 빠르게 충전하고 거래를 이어가세요.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="fade-up rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="amount">
                  충전 금액
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="예: 300000"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="method">
                  결제 수단
                </label>
                <select
                  id="method"
                  name="method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="card">신용카드</option>
                  <option value="bank">계좌이체</option>
                  <option value="crypto">암호화폐 지갑</option>
                </select>
              </div>

              {method === "card" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="cardNumber">
                      카드 번호
                    </label>
                    <input
                      id="cardNumber"
                      name="cardNumber"
                      type="text"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="cardExpiry">
                      만료일
                    </label>
                    <input
                      id="cardExpiry"
                      name="cardExpiry"
                      type="text"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="MM/YY"
                    />
                  </div>
                </div>
              ) : null}

              {method === "bank" ? (
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="bankAccount">
                    입금 계좌
                  </label>
                  <input
                    id="bankAccount"
                    name="bankAccount"
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="국민 123-456-789012"
                  />
                </div>
              ) : null}

              {method === "crypto" ? (
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="walletAddress">
                    지갑 주소
                  </label>
                  <input
                    id="walletAddress"
                    name="walletAddress"
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="0x...."
                  />
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="memo">
                  요청 메모 (선택)
                </label>
                <textarea
                  id="memo"
                  name="memo"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="특이사항이 있다면 적어주세요."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
              >
                결제 요청하기
              </button>
            </div>

            {status ? <p className="mt-4 text-xs text-primary">{status}</p> : null}
          </form>

          <aside className="fade-up rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">결제 요약</h2>
            <dl className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <dt>충전 금액</dt>
                <dd className="font-medium text-gray-900">{formatMoney(numericAmount)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>결제 수단</dt>
                <dd>{METHOD_LABELS[method]}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>예상 수수료(1.5%)</dt>
                <dd>{formatMoney(fee)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <dt className="font-semibold text-gray-900">총 결제액</dt>
                <dd className="font-semibold text-gray-900">{formatMoney(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-gray-400">
              실제 결제 연동 시 카드 인증/은행 확인 단계가 추가됩니다.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
