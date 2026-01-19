"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminCreateFaq, adminDeleteFaq, adminGetTicket, adminListFaqs, adminListTickets, adminPatchTicket, adminReplyTicket } from "@/lib/supportClient";

export default function AdminSupportPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [ticketFilter, setTicketFilter] = useState({ status: "", q: "" });
  const ticketsQ = useQuery({
    queryKey: ["admin.support.tickets", ticketFilter],
    queryFn: () => adminListTickets({ status: ticketFilter.status || null, q: ticketFilter.q || null })
  });

  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const ticketDetailQ = useQuery({
    queryKey: ["admin.support.ticket", selectedTicketId],
    queryFn: () => adminGetTicket(selectedTicketId),
    enabled: !!selectedTicketId
  });

  const [reply, setReply] = useState("");
  const replyM = useMutation({
    mutationFn: async () => await adminReplyTicket(selectedTicketId, reply),
    onSuccess: async () => {
      setReply("");
      await qc.invalidateQueries({ queryKey: ["admin.support.ticket", selectedTicketId] });
      await qc.invalidateQueries({ queryKey: ["admin.support.tickets"] });
    }
  });

  const patchTicketM = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => await adminPatchTicket(selectedTicketId, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.support.ticket", selectedTicketId] });
      await qc.invalidateQueries({ queryKey: ["admin.support.tickets"] });
    }
  });

  const faqsQ = useQuery({ queryKey: ["admin.support.faqs"], queryFn: adminListFaqs });
  const [faqForm, setFaqForm] = useState({ category: "general", question: "", answer_md: "", sort: 0, is_published: false });
  const createFaqM = useMutation({
    mutationFn: async () => await adminCreateFaq(faqForm as unknown as Record<string, unknown>),
    onSuccess: async () => {
      setFaqForm({ category: "general", question: "", answer_md: "", sort: 0, is_published: false });
      await qc.invalidateQueries({ queryKey: ["admin.support.faqs"] });
    }
  });
  const deleteFaqM = useMutation({
    mutationFn: async (id: string) => await adminDeleteFaq(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.support.faqs"] });
    }
  });

  const ticket = ticketDetailQ.data && typeof ticketDetailQ.data === "object" ? (ticketDetailQ.data as Record<string, unknown>) : null;
  const ticketObj = ticket && typeof ticket.ticket === "object" ? (ticket.ticket as Record<string, unknown>) : null;
  const messages = Array.isArray(ticket?.messages) ? (ticket?.messages as Array<Record<string, unknown>>) : [];

  const canReply = selectedTicketId && reply.trim().length > 0;

  const ticketItems = useMemo(() => {
    const raw = ticketsQ.data?.items;
    return Array.isArray(raw) ? raw : [];
  }, [ticketsQ.data?.items]);

  const faqItems = useMemo(() => {
    const raw = faqsQ.data?.items;
    return Array.isArray(raw) ? raw : [];
  }, [faqsQ.data?.items]);

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminSupport.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminSupport.desc")}</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminSupport.ticketList")}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={ticketFilter.q}
                  onChange={(e) => setTicketFilter((p) => ({ ...p, q: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminSupport.searchEmail")}
                />
                <select
                  value={ticketFilter.status}
                  onChange={(e) => setTicketFilter((p) => ({ ...p, status: e.target.value }))}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="">{t("adminSupport.all")}</option>
                  <option value="open">open</option>
                  <option value="pending">pending</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                </select>
              </div>
              {ticketsQ.isError ? <div className="mt-3"><ApiErrorView error={ticketsQ.error} onRetry={() => ticketsQ.refetch()} /></div> : null}
              <div className="mt-4 space-y-2">
                {ticketItems.map((it) => (
                  <button
                    key={String((it as { id?: unknown }).id || "")}
                    type="button"
                    onClick={() => setSelectedTicketId(String((it as { id?: unknown }).id || ""))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{String((it as { subject?: unknown }).subject || "")}</p>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {String((it as { status?: unknown }).status || "").toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{String((it as { user_email?: unknown }).user_email || "")}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminSupport.ticketDetail")}</h2>
              {!selectedTicketId ? (
                <p className="mt-3 text-sm text-gray-500">{t("adminSupport.selectTicket")}</p>
              ) : ticketDetailQ.isError ? (
                <div className="mt-3">
                  <ApiErrorView error={ticketDetailQ.error} onRetry={() => ticketDetailQ.refetch()} />
                </div>
              ) : (
                <>
                  <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-600">{String(ticketObj?.user_email || "")}</p>
                    <p className="mt-1 font-semibold text-gray-900">{String(ticketObj?.subject || "")}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {t("adminSupport.status")} {String(ticketObj?.status || "").toUpperCase()} · {t("adminSupport.priority")} {String(ticketObj?.priority || "")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => patchTicketM.mutate({ status: "resolved" })}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                      >
                        {t("adminSupport.markResolved")}
                      </button>
                      <button
                        type="button"
                        onClick={() => patchTicketM.mutate({ status: "closed" })}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                      >
                        {t("adminSupport.markClosed")}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {messages.map((m) => (
                      <div key={String(m.id || "")} className={`rounded-2xl border border-gray-200 px-4 py-3 ${m.author === "admin" ? "bg-primary/5" : "bg-gray-50"}`}>
                        <p className="text-xs font-semibold text-gray-500">{String(m.author || "")} · {String(m.created_at || "").slice(0, 19).replace("T", " ")}</p>
                        <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{String(m.body_md || "")}</p>
                      </div>
                    ))}
                  </div>

                  {replyM.isError || patchTicketM.isError ? <div className="mt-3"><ApiErrorView error={replyM.error || patchTicketM.error} /></div> : null}

                  <div className="mt-4">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="h-28 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      placeholder={t("adminSupport.replyPh")}
                    />
                    <button
                      type="button"
                      disabled={!canReply || replyM.isPending}
                      onClick={() => replyM.mutate()}
                      className="mt-2 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                    >
                      {t("adminSupport.reply")}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminSupport.faqNew")}</h2>
              <div className="mt-4 grid gap-3">
                <input
                  value={faqForm.category}
                  onChange={(e) => setFaqForm((p) => ({ ...p, category: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminSupport.category")}
                />
                <input
                  value={faqForm.question}
                  onChange={(e) => setFaqForm((p) => ({ ...p, question: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminSupport.question")}
                />
                <textarea
                  value={faqForm.answer_md}
                  onChange={(e) => setFaqForm((p) => ({ ...p, answer_md: e.target.value }))}
                  className="h-28 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminSupport.answer")}
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={faqForm.is_published} onChange={(e) => setFaqForm((p) => ({ ...p, is_published: e.target.checked }))} />
                  {t("adminSupport.published")}
                </label>
                {createFaqM.isError ? <ApiErrorView error={createFaqM.error} /> : null}
                <button
                  type="button"
                  disabled={!faqForm.question.trim() || !faqForm.answer_md.trim() || createFaqM.isPending}
                  onClick={() => createFaqM.mutate()}
                  className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                >
                  {t("adminSupport.create")}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminSupport.faqList")}</h2>
              {faqsQ.isError ? <div className="mt-3"><ApiErrorView error={faqsQ.error} onRetry={() => faqsQ.refetch()} /></div> : null}
              <div className="mt-4 space-y-2">
                {faqItems.map((it) => (
                  <div key={String((it as { id?: unknown }).id || "")} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="font-semibold text-gray-900">{String((it as { question?: unknown }).question || "")}</p>
                    <p className="mt-1 text-xs text-gray-600">{String((it as { category?: unknown }).category || "")}</p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => deleteFaqM.mutate(String((it as { id?: unknown }).id || ""))}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200"
                      >
                        {t("adminSupport.delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </RequireAdmin>
  );
}

