"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import {
  createDeveloperApiKey,
  listDeveloperApiKeys,
  revokeDeveloperApiKey,
  rotateDeveloperApiKey,
  type DeveloperApiKey
} from "@/lib/developerClient";

export default function DeveloperPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [oneTimeKey, setOneTimeKey] = useState<{ api_key: string; prefix: string } | null>(null);

  const keysQ = useQuery({ queryKey: ["developer.api_keys"], queryFn: listDeveloperApiKeys });

  const items = useMemo(() => {
    const arr = keysQ.data?.items ?? [];
    return [...arr].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }, [keysQ.data]);

  const createM = useMutation({
    mutationFn: async () => await createDeveloperApiKey(name.trim()),
    onSuccess: async (res) => {
      setName("");
      setOneTimeKey({ api_key: res.api_key, prefix: res.prefix });
      await qc.invalidateQueries({ queryKey: ["developer.api_keys"] });
    }
  });

  const revokeM = useMutation({
    mutationFn: async (id: string) => await revokeDeveloperApiKey(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["developer.api_keys"] });
    }
  });

  const rotateM = useMutation({
    mutationFn: async (id: string) => await rotateDeveloperApiKey(id),
    onSuccess: async (res) => {
      setOneTimeKey({ api_key: res.api_key, prefix: res.prefix });
      await qc.invalidateQueries({ queryKey: ["developer.api_keys"] });
    }
  });

  const curlExample = oneTimeKey?.api_key
    ? `curl -sS \\\n  -H "X-API-Key: ${oneTimeKey.api_key}" \\\n  "$API_BASE/api/v1/market/bootstrap?market=spot&scope=managed&sort=qv&order=desc&window=1d&limit=10"\n`
    : `curl -sS \\\n  -H "X-API-Key: <YOUR_API_KEY>" \\\n  "$API_BASE/api/v1/market/bootstrap?market=spot&scope=managed&sort=qv&order=desc&window=1d&limit=10"\n`;

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("developer.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("developer.desc")}</p>
          </header>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("developer.createKey")}</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                placeholder={t("developer.namePlaceholder")}
              />
              <button
                type="button"
                disabled={!name.trim() || createM.isPending}
                onClick={() => createM.mutate()}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
              >
                {t("developer.create")}
              </button>
            </div>
            {createM.isError ? <div className="mt-3"><ApiErrorView error={createM.error} /></div> : null}

            {oneTimeKey ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{t("developer.oneTimeKeyTitle")}</p>
                <p className="mt-1 text-xs text-gray-700">{t("developer.oneTimeKeyDesc")}</p>
                <div className="mt-3 rounded-xl border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-gray-800 break-all">
                  {oneTimeKey.api_key}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOneTimeKey(null)}
                    className="inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                  >
                    {t("developer.close")}
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("developer.keys")}</h2>
            {keysQ.isError ? <div className="mt-4"><ApiErrorView error={keysQ.error} onRetry={() => keysQ.refetch()} /></div> : null}

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500">
                    <th className="py-2 pr-4">{t("developer.name")}</th>
                    <th className="py-2 pr-4">{t("developer.prefix")}</th>
                    <th className="py-2 pr-4">{t("developer.lastUsedAt")}</th>
                    <th className="py-2 pr-4">{t("developer.status")}</th>
                    <th className="py-2 pr-4">{t("developer.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && !keysQ.isFetching ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                        {t("developer.emptyKeys")}
                      </td>
                    </tr>
                  ) : null}
                  {items.map((k: DeveloperApiKey) => (
                    <tr key={k.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">{k.name}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{k.prefix}</td>
                      <td className="py-3 pr-4 text-xs text-gray-600">{k.last_used_at ? String(k.last_used_at) : "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {k.revoked_at ? t("developer.revoked") : t("developer.active")}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={Boolean(k.revoked_at) || rotateM.isPending}
                            onClick={() => rotateM.mutate(k.id)}
                            className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-50"
                          >
                            {t("developer.rotate")}
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(k.revoked_at) || revokeM.isPending}
                            onClick={() => revokeM.mutate(k.id)}
                            className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200 disabled:opacity-50"
                          >
                            {t("developer.revoke")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {revokeM.isError ? <div className="mt-4"><ApiErrorView error={revokeM.error} /></div> : null}
            {rotateM.isError ? <div className="mt-4"><ApiErrorView error={rotateM.error} /></div> : null}
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("developer.externalApiTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("developer.externalApiDesc")}</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500">{t("developer.endpoints")}</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  <li className="font-mono text-xs">GET /api/v1/market/*</li>
                  <li className="font-mono text-xs">GET /api/v1/symbols/*</li>
                  <li className="font-mono text-xs">GET /api/v1/watchlists/*</li>
                  <li className="font-mono text-xs">GET /api/v1/alerts/*</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500">{t("developer.authHeader")}</p>
                <div className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-800">
                  X-API-Key: {"<api_key>"}
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">{t("developer.rateLimitHint")}</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-800">
              {curlExample}
            </pre>
          </section>
        </div>
      </main>
    </RequireAuth>
  );
}
