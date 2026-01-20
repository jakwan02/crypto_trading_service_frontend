import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type OnboardingState = { step: Record<string, unknown>; completed_at?: string | null; updated_at?: string | null };

export type OnboardingSummary = {
  steps: Record<string, unknown>;
  progress: { done: number; total: number; pct: number };
  next_actions: Array<{ key: string; title: string; cta_path: string }>;
};

export async function getOnboarding(): Promise<{ state: OnboardingState }> {
  return await apiRequest<{ state: OnboardingState }>("/onboarding", { method: "GET", headers: requireAuthHeaders() });
}

export async function getOnboardingSummary(): Promise<OnboardingSummary> {
  return await apiRequest<OnboardingSummary>("/onboarding/summary", { method: "GET", headers: requireAuthHeaders() });
}

export async function patchOnboarding(payload: { step?: Record<string, unknown>; completed?: boolean | null }): Promise<{ state: OnboardingState }> {
  return await apiRequest<{ state: OnboardingState }>("/onboarding", { method: "PATCH", headers: requireAuthHeaders(), json: payload as Record<string, unknown> });
}
