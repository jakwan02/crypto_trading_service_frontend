import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type OnboardingState = { step: Record<string, unknown>; completed_at?: string | null; updated_at?: string | null };

export async function getOnboarding(): Promise<{ state: OnboardingState }> {
  return await apiRequest<{ state: OnboardingState }>("/onboarding", { method: "GET", headers: requireAuthHeaders() });
}

export async function patchOnboarding(payload: { step?: Record<string, unknown>; completed?: boolean | null }): Promise<{ state: OnboardingState }> {
  return await apiRequest<{ state: OnboardingState }>("/onboarding", { method: "PATCH", headers: requireAuthHeaders(), json: payload as Record<string, unknown> });
}
