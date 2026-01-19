"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import { addMyTicketMessage, closeMyTicket, getMyTicket } from "@/lib/supportClient";

export default function TicketDetailPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const params = useParams<{ id?: string }>();
  const id = String(params?.id || "").trim();
  const [body, setBody] = useState("");

  const q = useQuery({
    queryKey: ["support.ticket", id],
    queryFn: () => getMyTicket(id),
    enabled: !!id
  });

  const ticket = q.data?.ticket;
  const messages = q.data?.messages ?? [];

  const addM = useMutation({
    mutationFn: async () => await addMyTicketMessage(id, body),
    onSuccess: async () => {
      setBody("");
      await qc.invalidateQueries({ queryKey: ["support.ticket", id] });
      await qc.invalidateQueries({ queryKey: ["support.tickets"] });
    }
  });

  const closeM = useMutation({
    mutationFn: async () => await closeMyTicket(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["support.ticket", id] });
      await qc.invalidateQueries({ queryKey: ["support.tickets"] });
    }
  });

  const canSend = body.trim().length > 0 && !addM.isPending;
  const isClosed = String(ticket?.status || "").toLowerCase() === "closed";

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          {!id ? (
            <p className="text-sm text-gray-500">{t("supportTicket.invalidId")}</p>
          ) : q.isError ? (
            <ApiErrorView error={q.error} onRetry={() => q.refetch()} />
          ) : (
            <>
              <header className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">{ticket?.subject || t("supportTicket.title")}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {t("supportTicket.meta")} {ticket?.status ? String(ticket.status).toUpperCase() : "-"}
                </p>
              </header>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("supportTicket.thread")}</h2>
                {messages.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">{q.isLoading ? t("common.loading") : t("supportTicket.emptyThread")}</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {messages.map((m) => (
                      <div key={m.id} className={`rounded-2xl border border-gray-200 px-4 py-3 ${m.author === "admin" ? "bg-primary/5" : "bg-gray-50"}`}>
                        <p className="text-xs font-semibold text-gray-500">
                          {m.author === "admin" ? t("supportTicket.admin") : t("supportTicket.me")} ·{" "}
                          {String(m.created_at).slice(0, 19).replace("T", " ")}
                        </p>
                        <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{m.body_md}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("supportTicket.reply")}</h2>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="mt-3 h-32 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("supportTicket.replyPh")}
                  disabled={isClosed}
                />
                {(addM.isError || closeM.isError) ? <div className="mt-3"><ApiErrorView error={addM.error || closeM.error} /></div> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canSend || isClosed}
                    onClick={() => addM.mutate()}
                    className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                  >
                    {addM.isPending ? t("common.loading") : t("supportTicket.send")}
                  </button>
                  <button
                    type="button"
                    disabled={closeM.isPending || isClosed}
                    onClick={() => closeM.mutate()}
                    className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-60"
                  >
                    {t("supportTicket.close")}
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
