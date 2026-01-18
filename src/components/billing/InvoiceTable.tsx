"use client";

import type { Invoice } from "@/types/billing";

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

export default function InvoiceTable({ items, onDownload, limit }: Props) {
  const view = limit ? items.slice(0, limit) : items;
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full table-fixed">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-semibold text-gray-600">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Currency</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Download</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
          {view.length ? (
            view.map((inv) => (
              <tr key={inv.id} className="bg-white">
                <td className="px-4 py-3">{fmtDate(inv.issued_at)}</td>
                <td className="px-4 py-3">
                  {typeof inv.amount_minor === "number"
                    ? inv.amount_minor
                    : typeof inv.amount_cents === "number"
                      ? inv.amount_cents / 100
                      : "-"}
                </td>
                <td className="px-4 py-3">{inv.currency || "-"}</td>
                <td className="px-4 py-3">{inv.status || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDownload(inv.id)}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                No invoices
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

