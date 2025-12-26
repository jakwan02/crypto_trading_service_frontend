import { describe, expect, it } from "vitest";
import { nextBackoff } from "./backoff";

describe("nextBackoff", () => {
  it("increases with attempt and stays within bounds", () => {
    const base = 400;
    const max = 8000;
    const fixedRandom = () => 0.5;

    const first = nextBackoff(0, { baseMs: base, maxMs: max, random: fixedRandom });
    const later = nextBackoff(3, { baseMs: base, maxMs: max, random: fixedRandom });
    const capped = nextBackoff(10, { baseMs: base, maxMs: max, random: fixedRandom });

    expect(first).toBeGreaterThanOrEqual(Math.round(base * 0.6));
    expect(first).toBeLessThanOrEqual(Math.round(base * 1.4));
    expect(later).toBeGreaterThan(first);
    expect(capped).toBeLessThanOrEqual(Math.round(max * 1.4));
  });
});
