// filename: frontend/hooks/useMediaQuery.ts
// 변경 이유: 모바일/데스크톱 레이아웃을 동일 컴포넌트에서 안전하게 분기해, 테이블 가로 잘림/스크롤 UX를 개선한다.
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);

    const onChange = () => setMatches(Boolean(mq.matches));
    onChange();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [query]);

  return matches;
}

