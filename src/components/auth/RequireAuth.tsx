"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const { user, sessionReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    if (!sessionReady) return;
    if (user) return;
    const query = searchParams?.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [user, sessionReady, router, pathname, searchParams]);

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
