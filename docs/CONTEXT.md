# Project Context (frontend)

## Goal
- CoinDash 프론트(Next.js App Router, TypeScript)는 다음을 제공한다.
  - 시장/차트/알림/뉴스/AI 인사이트(Week1)
  - 결제·청구·사용량·워치리스트(Week2)
- 백엔드 계약 기반으로만 동작한다. (REST `/api/*`, 인증 필요 `/app/*`, WS `/ws_*`)

## Runtime & stack
- Next.js App Router + React Query(@tanstack/react-query) + Tailwind
- i18n: `react-i18next` (nsSeparator="." 기반 namespace 사용)

## Routes (핵심)
- Week2
  - `/upgrade`: 플랜/상품 선택 → `/app/billing/checkout` → `redirect_url` 이동
  - `/billing`: 내 상태(/app/billing/me), 해지/재활성/환불/인보이스 요약
  - `/billing/return`: 결제 복귀(상태 폴링) → auth.refresh → `/billing`
  - `/billing/invoices`: 인보이스 목록/다운로드
  - `/usage`: 사용량/한도(엔티틀먼트) 대시보드
  - `/watchlists`: 워치리스트 CRUD/공유
  - `/watchlists/[id]`: 워치리스트 상세
  - `/watchlists/shared/[token]`: 공유 공개 페이지(로그인 불필요)
  - `/dev/billing`: 개발용(무인증) mock 결제 플로우(ENV gate)

## Key modules (map)
- 인증/세션
  - `src/contexts/AuthContext.tsx`
  - `src/lib/appClient.ts` (인증 포함 `/app/*` 호출, refresh/Retry-After 파싱 포함)
- Billing/Usage/Watchlists
  - `src/lib/billingClient.ts` (auth 포함)
  - `src/lib/watchlistsClient.ts` (auth 포함)
  - `src/lib/publicClient.ts` (무인증 `/api/*` 호출)
- 에러 UX
  - `src/components/common/ApiErrorView.tsx` (코드→문구/CTA 매핑, PROD는 디버그 숨김)
- i18n
  - `src/i18n/i18n.ts` (ns 자동 구성, nsSeparator=".")
  - `src/i18n/locales/{ko,en}.ts` (최상위 키 = namespace)

## Invariants (절대 깨지면 안 됨)
1) **결제 성공 판정은 서버 상태로만**
   - 리다이렉트 결과/파라미터만으로 “성공” 확정 금지
   - `/billing/return`에서 `/app/billing/checkout/{order_no}/status` 또는 `/app/billing/me`로 확인 후 auth refresh
2) **서버 에러 메시지 그대로 노출 금지(PROD)**
   - 화면에는 사용자 친화 문구 + 다음 행동(CTA)만 제공
   - DEV에서만 `<details>`로 디버그 표시
3) **/api vs /app 분리 유지**
   - 공개 공유 워치리스트는 `/api/watchlists/shared/{token}`
   - 결제/청구/사용량/개인 워치리스트는 `/app/*`(Bearer)
4) **DEV 결제는 production에 노출 금지**
   - `/dev/billing` 및 `/api/dev/billing/checkout`는 `NEXT_PUBLIC_ENABLE_DEV_BILLING=1` + `NODE_ENV!=="production"` 게이트를 유지
   - Dev token을 브라우저에 하드코딩하지 않는다(서버 라우트에서만 주입)
5) **i18n namespace 누락으로 키 문자열이 화면에 노출되면 안 됨**
   - `src/i18n/i18n.ts`의 namespace 자동 구성 유지(하드코딩 ns 목록으로 회귀 금지)

## How to run (권장)
```bash
npm ci
npm run dev
```

## When starting a new chat (AI 최소 주입)
- 프론트 작업: `docs/CONTEXT.md` + `docs/RECENT.md`
- 백엔드 인터페이스/정책 변경이 포함되면: `backend/docs/CONTRACTS.md`도 추가

