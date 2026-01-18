"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import InvoiceTable from "@/components/billing/InvoiceTable";
import { getInvoices, getInvoiceDownloadUrl } from "@/lib/billingClient";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function BillingInvoicesPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["billingInvoices"],
    queryFn: getInvoices
  });

  const onDownload = useCallback((id: string) => {
    const url = getInvoiceDownloadUrl(id);
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("billing.invoices.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("billing.invoices.desc")}</p>
          </header>

          {query.isLoading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : query.isError ? (
            <ApiErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <InvoiceTable items={query.data?.items ?? []} onDownload={onDownload} />
          )}
        </div>
      </main>
    </RequireAuth>
  );
}

