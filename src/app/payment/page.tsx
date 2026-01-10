"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function PaymentPage() {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("card");
  const [status, setStatus] = useState<string>("");
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const methodLabels: Record<string, string> = {
    card: t("payment.methods.card"),
    bank: t("payment.methods.bank"),
    crypto: t("payment.methods.crypto")
  };

  const numericAmount = useMemo(() => Number(amount), [amount]);
  const fee = useMemo(() => (Number.isFinite(numericAmount) ? numericAmount * 0.015 : 0), [numericAmount]);
  const total = useMemo(() => (Number.isFinite(numericAmount) ? numericAmount + fee : 0), [numericAmount, fee]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    console.log("payment_submit", payload);
    setStatus(t("payment.statusSubmitted"));
  };

  const formatMoney = (value: number) =>
    Number.isFinite(value) && value > 0 ? value.toLocaleString(locale) : "-";

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("common.payment")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("common.paymentDesc")}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="fade-up rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="amount">
                  {t("payment.amountLabel")}
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={t("payment.amountPlaceholder")}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="method">
                  {t("payment.methodLabel")}
                </label>
                <select
                  id="method"
                  name="method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="card">{t("payment.methods.card")}</option>
                  <option value="bank">{t("payment.methods.bank")}</option>
                  <option value="crypto">{t("payment.methods.crypto")}</option>
                </select>
              </div>

              {method === "card" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="cardNumber">
                      {t("payment.cardNumber")}
                    </label>
                    <input
                      id="cardNumber"
                      name="cardNumber"
                      type="text"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={t("payment.cardNumberPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="cardExpiry">
                      {t("payment.cardExpiry")}
                    </label>
                    <input
                      id="cardExpiry"
                      name="cardExpiry"
                      type="text"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={t("payment.cardExpiryPlaceholder")}
                    />
                  </div>
                </div>
              ) : null}

              {method === "bank" ? (
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="bankAccount">
                    {t("payment.bankAccount")}
                  </label>
                  <input
                    id="bankAccount"
                    name="bankAccount"
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder={t("payment.bankAccountPlaceholder")}
                  />
                </div>
              ) : null}

              {method === "crypto" ? (
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="walletAddress">
                    {t("payment.walletAddress")}
                  </label>
                  <input
                    id="walletAddress"
                    name="walletAddress"
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder={t("payment.walletAddressPlaceholder")}
                  />
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="memo">
                  {t("payment.memoLabel")}
                </label>
                <textarea
                  id="memo"
                  name="memo"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={t("payment.memoPlaceholder")}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-primary-dark"
              >
                {t("payment.submit")}
              </button>
            </div>

            {status ? <p className="mt-4 text-xs text-primary">{status}</p> : null}
          </form>

          <aside className="fade-up rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("payment.summaryTitle")}</h2>
            <dl className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <dt>{t("payment.summary.amount")}</dt>
                <dd className="font-medium text-gray-900">{formatMoney(numericAmount)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t("payment.summary.method")}</dt>
                <dd>{methodLabels[method]}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t("payment.summary.fee")}</dt>
                <dd>{formatMoney(fee)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <dt className="font-semibold text-gray-900">{t("payment.summary.total")}</dt>
                <dd className="font-semibold text-gray-900">{formatMoney(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-gray-400">
              {t("payment.summary.note")}
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
