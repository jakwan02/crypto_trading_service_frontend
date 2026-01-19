"use client";

import type { Invoice } from "@/types/billing";
import { useTranslation } from "react-i18next";

type Props = {
  items: Invoice[];
  onDownload: (id: string) => void;
  limit?: number;
};

function fmtDate(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function fmtAmount(inv: Invoice): string {
  if (typeof inv.amount_minor === "number") {
    const unitRaw = typeof inv.minor_unit === "number" ? inv.minor_unit : 0;
    const unit = Math.max(0, Math.min(8, Math.floor(unitRaw)));
    const denom = Math.pow(10, unit);
    const v = denom > 0 ? inv.amount_minor / denom : inv.amount_minor;
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: unit, maximumFractionDigits: unit }).format(v);
  }
  if (typeof inv.amount_cents === "number") {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      inv.amount_cents / 100
    );
  }
  return "-";
}

export default function InvoiceTable({ items, onDownload, limit }: Props) {
  const { t } = useTranslation();
  const view = limit ? items.slice(0, limit) : items;
  const statusLabel = (raw?: string | null): string => {
    const v = String(raw || "").trim().toLowerCase();
    if (!v) return "-";
    if (v === "paid" || v === "succeeded") return t("billing.invoices.status.paid");
    if (v === "pending" || v === "open") return t("billing.invoices.status.pending");
    if (v === "unpaid") return t("billing.invoices.status.unpaid");
    if (v === "failed") return t("billing.invoices.status.failed");
    if (v === "refunded") return t("billing.invoices.status.refunded");
    if (v === "canceled" || v === "void") return t("billing.invoices.status.canceled");
    return t("billing.invoices.status.unknown");
  };
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full table-fixed">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-semibold text-gray-600">
            <th className="px-4 py-3">{t("billing.invoices.table.date")}</th>
            <th className="px-4 py-3">{t("billing.invoices.table.amount")}</th>
            <th className="px-4 py-3">{t("billing.invoices.table.currency")}</th>
            <th className="px-4 py-3">{t("billing.invoices.table.status")}</th>
            <th className="px-4 py-3 text-right">{t("billing.invoices.table.download")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
          {view.length ? (
            view.map((inv) => (
              <tr key={inv.id} className="bg-white">
                <td className="px-4 py-3">{fmtDate(inv.issued_at)}</td>
                <td className="px-4 py-3">{fmtAmount(inv)}</td>
                <td className="px-4 py-3">{inv.currency || "-"}</td>
                <td className="px-4 py-3">{statusLabel(inv.status)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDownload(inv.id)}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary"
                  >
                    {t("billing.invoices.table.downloadCta")}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                {t("billing.invoices.table.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
