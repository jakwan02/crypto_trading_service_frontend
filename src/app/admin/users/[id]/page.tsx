"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminCreateEntGrant, adminGetUser, adminPatchUserRole, adminRevokeEntGrant } from "@/lib/adminUsersClient";
import { adminRevokeApiKey } from "@/lib/developerClient";

export default function AdminUserDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const userId = String(params?.id || "");
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin.user", userId],
    queryFn: async () => await adminGetUser(userId),
    enabled: Boolean(userId)
  });

  const user = q.data?.user;

  const [role, setRole] = useState<"user" | "admin">("user");
  const [grantPlan, setGrantPlan] = useState("pro");
  const [grantSource, setGrantSource] = useState<"admin" | "promo">("admin");
  const [grantEndsAt, setGrantEndsAt] = useState("");
  const [grantReason, setGrantReason] = useState("");

  const userRole = useMemo(() => {
    const r = String(user?.role || "").toLowerCase();
    return r === "admin" || r === "user" ? (r as "admin" | "user") : "user";
  }, [user?.role]);
  const [roleTouched, setRoleTouched] = useState(false);
  const roleValue = roleTouched ? role : userRole;

  const patchRoleM = useMutation({
    mutationFn: async () => await adminPatchUserRole(userId, roleValue),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.user", userId] });
    }
  });

  const createGrantM = useMutation({
    mutationFn: async () =>
      await adminCreateEntGrant(userId, {
        plan_code: grantPlan,
        source: grantSource,
        ends_at: grantEndsAt.trim() || null,
        reason: grantReason.trim() || null
      }),
    onSuccess: async () => {
      setGrantEndsAt("");
      setGrantReason("");
      await qc.invalidateQueries({ queryKey: ["admin.user", userId] });
    }
  });

  const revokeGrantM = useMutation({
    mutationFn: async (grantId: string) => await adminRevokeEntGrant(userId, grantId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.user", userId] });
    }
  });

  const revokeApiKeyM = useMutation({
    mutationFn: async (keyId: string) => await adminRevokeApiKey(keyId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.user", userId] });
    }
  });

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminUserDetail.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminUserDetail.desc")}</p>
          </header>

          {q.isError ? <ApiErrorView error={q.error} onRetry={() => q.refetch()} /> : null}

          {q.data ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("adminUserDetail.profile")}</h2>
                <dl className="mt-4 grid gap-3 text-sm text-gray-700">
                  <div>
                    <dt className="text-xs font-semibold text-gray-500">{t("adminUsers.email")}</dt>
                    <dd className="mt-1 font-semibold text-gray-900">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-500">ID</dt>
                    <dd className="mt-1 font-mono text-xs text-gray-700">{user?.id}</dd>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold text-gray-500">{t("adminUserDetail.role")}</dt>
                      <dd className="mt-2">
                        <select
                          value={roleValue}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v !== "user" && v !== "admin") return;
                            setRoleTouched(true);
                            setRole(v);
                          }}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          <option value="user">{t("adminUsers.roleUser")}</option>
                          <option value="admin">{t("adminUsers.roleAdmin")}</option>
                        </select>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-gray-500">{t("adminUsers.plan")}</dt>
                      <dd className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                        {String(user?.plan || "").toUpperCase()}
                      </dd>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500">{t("adminUserDetail.emailVerified")}</p>
                      <p className="mt-1 font-semibold text-gray-900">{q.data.security.email_verified ? "YES" : "NO"}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500">{t("adminUserDetail.has2fa")}</p>
                      <p className="mt-1 font-semibold text-gray-900">{q.data.security.has_2fa ? "YES" : "NO"}</p>
                    </div>
                  </div>
                </dl>

                {patchRoleM.isError ? <div className="mt-4"><ApiErrorView error={patchRoleM.error} /></div> : null}
                <button
                  type="button"
                  disabled={patchRoleM.isPending}
                  onClick={() => patchRoleM.mutate()}
                  className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                >
                  {t("adminUserDetail.saveRole")}
                </button>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("adminUserDetail.entGrants")}</h2>
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t("adminUserDetail.planCode")}</label>
                      <input
                        value={grantPlan}
                        onChange={(e) => setGrantPlan(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t("adminUserDetail.source")}</label>
                      <select
                        value={grantSource}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v !== "admin" && v !== "promo") return;
                          setGrantSource(v);
                        }}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        <option value="admin">admin</option>
                        <option value="promo">promo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t("adminUserDetail.endsAt")}</label>
                      <input
                        value={grantEndsAt}
                        onChange={(e) => setGrantEndsAt(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                        placeholder="2026-01-26T00:00:00Z"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("adminUserDetail.reason")}</label>
                    <input
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  {createGrantM.isError ? <ApiErrorView error={createGrantM.error} /> : null}
                  <button
                    type="button"
                    disabled={createGrantM.isPending || !grantPlan.trim()}
                    onClick={() => createGrantM.mutate()}
                    className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                  >
                    {t("adminUserDetail.grant")}
                  </button>
                </div>

                <div className="mt-6 space-y-2">
                  {(q.data.ent_grants ?? []).map((g) => (
                    <div key={g.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{g.source} · {g.kind} · {g.provider}</p>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                          {String(g.status || "").toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {g.starts_at ?? "—"} → {g.ends_at ?? "—"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={revokeGrantM.isPending}
                          onClick={() => revokeGrantM.mutate(g.id)}
                          className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200 disabled:opacity-60"
                        >
                          {t("adminUserDetail.revoke")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-sm font-semibold text-gray-900">{t("adminUserDetail.apiKeys")}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[700px] w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500">
                        <th className="py-2 pr-4">ID</th>
                        <th className="py-2 pr-4">{t("adminUserDetail.name")}</th>
                        <th className="py-2 pr-4">{t("adminUserDetail.prefix")}</th>
                        <th className="py-2 pr-4">{t("adminUserDetail.status")}</th>
                        <th className="py-2 pr-4">{t("adminUserDetail.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(q.data.api_keys ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                            {t("adminUserDetail.noApiKeys")}
                          </td>
                        </tr>
                      ) : null}
                      {(q.data.api_keys ?? []).map((k) => (
                        <tr key={k.id} className="border-b border-gray-100">
                          <td className="py-3 pr-4 font-mono text-xs">{k.id}</td>
                          <td className="py-3 pr-4">{k.name}</td>
                          <td className="py-3 pr-4 font-mono text-xs">{k.prefix}</td>
                          <td className="py-3 pr-4">{k.revoked_at ? t("adminUserDetail.revoked") : t("adminUserDetail.active")}</td>
                          <td className="py-3 pr-4">
                            <button
                              type="button"
                              disabled={Boolean(k.revoked_at) || revokeApiKeyM.isPending}
                              onClick={() => revokeApiKeyM.mutate(k.id)}
                              className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200 disabled:opacity-60"
                            >
                              {t("adminUserDetail.revoke")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {revokeApiKeyM.isError ? <div className="mt-4"><ApiErrorView error={revokeApiKeyM.error} /></div> : null}
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </RequireAdmin>
  );
}
