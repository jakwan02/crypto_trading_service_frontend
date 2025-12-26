import Link from "next/link";

const trades = [
  {
    id: "t1",
    time: "2025-02-14 09:32",
    symbol: "BTCUSDT",
    side: "Buy",
    price: "48,320",
    qty: "0.012",
    fee: "0.08 USDT"
  },
  {
    id: "t2",
    time: "2025-02-13 21:10",
    symbol: "ETHUSDT",
    side: "Sell",
    price: "2,610",
    qty: "0.42",
    fee: "0.54 USDT"
  },
  {
    id: "t3",
    time: "2025-02-12 16:45",
    symbol: "SOLUSDT",
    side: "Buy",
    price: "112.4",
    qty: "8.0",
    fee: "0.22 USDT"
  }
];

const payments = [
  {
    id: "p1",
    date: "2025-02-10",
    amount: "300,000 KRW",
    method: "Credit Card",
    status: "Completed"
  },
  {
    id: "p2",
    date: "2025-02-01",
    amount: "0.15 BTC",
    method: "Crypto Wallet",
    status: "Pending"
  },
  {
    id: "p3",
    date: "2025-01-22",
    amount: "500,000 KRW",
    method: "Bank Transfer",
    status: "Completed"
  }
];

const statusStyle: Record<string, string> = {
  Completed: "text-emerald-600",
  Pending: "text-amber-600",
  Failed: "text-red-600"
};

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Account</h1>
          <p className="mt-1 text-sm text-gray-500">
            내 정보와 거래/결제 이력을 한 곳에서 관리하세요.
          </p>
        </header>

        <section className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">My Info</h2>
            <dl className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <dt>이메일</dt>
                <dd className="font-medium text-gray-900">trader@coindash.com</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>가입일</dt>
                <dd>2024-11-03</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>잔액</dt>
                <dd className="font-medium text-gray-900">12,430 USDT</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>인증 상태</dt>
                <dd className="text-emerald-600">Verified</dd>
              </div>
            </dl>
            <div className="mt-4">
              <button
                type="button"
                className="text-xs font-medium text-primary hover:text-blue-600"
              >
                프로필 편집
              </button>
            </div>
          </div>

          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Security</h2>
            <p className="mt-3 text-sm text-gray-600">
              2FA, 로그인 알림, 지갑 출금 제한을 설정하세요.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700"
            >
              보안 설정 관리
            </button>
          </div>

          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Payments</h2>
            <p className="mt-3 text-sm text-gray-600">
              결제수단을 등록하고 잔액을 즉시 충전하세요.
            </p>
            <Link
              href="/payment"
              className="mt-4 inline-flex rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white"
            >
              결제/충전 시작
            </Link>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Trade History</h2>
            <span className="text-xs text-gray-400">최근 30일</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Side</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-500">{trade.time}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{trade.symbol}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          trade.side === "Buy" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-3 py-2">{trade.price}</td>
                    <td className="px-3 py-2">{trade.qty}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{trade.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <span className="text-xs text-gray-400">최근 6개월</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-500">{payment.date}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{payment.amount}</td>
                    <td className="px-3 py-2">{payment.method}</td>
                    <td className={`px-3 py-2 text-xs font-semibold ${statusStyle[payment.status] || "text-gray-500"}`}>
                      {payment.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
