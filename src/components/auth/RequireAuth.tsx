"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const { user, sessionReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    /* # 변경 이유: Next prerender 시 useSearchParams 사용으로 빌드 오류가 발생해, 클라이언트에서만 location 기반으로 next를 계산 */
    if (!sessionReady) return;
    if (user) return;
    const next =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : pathname;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [user, sessionReady, router, pathname]);

  if (!sessionReady) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto flex w-full max-w-md items-center justify-center px-4 py-24">
          <p className="text-sm text-gray-500">{t("common.loading")}</p>
        </div>
      </main>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
