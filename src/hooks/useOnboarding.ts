"use client";

// 변경 이유: Week6 온보딩 진행률/다음 액션을 여러 페이지에서 재사용하기 위해 훅으로 캡슐화

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getOnboarding, getOnboardingSummary } from "@/lib/onboardingClient";

export function useOnboarding() {
  const { user, sessionReady } = useAuth();
  const enabled = Boolean(user && sessionReady);

  const stateQ = useQuery({
    queryKey: ["onboarding"],
    queryFn: getOnboarding,
    enabled
  });

  const summaryQ = useQuery({
    queryKey: ["onboardingSummary"],
    queryFn: getOnboardingSummary,
    enabled
  });

  const completed = useMemo(() => {
    const completedAt = stateQ.data?.state?.completed_at ?? null;
    if (completedAt) return true;
    const pct = summaryQ.data?.progress?.pct ?? 0;
    return pct >= 100;
  }, [stateQ.data?.state?.completed_at, summaryQ.data?.progress?.pct]);

  const nextAction = useMemo(() => {
    const actions = summaryQ.data?.next_actions ?? [];
    return actions.length > 0 ? actions[0] : null;
  }, [summaryQ.data?.next_actions]);

  return {
    enabled,
    user,
    stateQ,
    summaryQ,
    completed,
    nextAction
  };
}

