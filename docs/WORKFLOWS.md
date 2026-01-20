# Workflows (frontend)

## 1) Billing: Upgrade → Checkout redirect → Return → Billing 반영
1) `/upgrade`
   - `GET /app/billing/plans` 로 플랜/혜택 표시
   - 결제 시작: `POST /app/billing/checkout`
     - body: `{ plan_code, kind:"sub"|"pass30", provider, currency, return_path, cancel_path }`
   - 성공 시 `redirect_url`로 `window.location.assign()`
2) 결제사 → `/billing/return` 복귀
   - `order_no`(또는 checkout id)를 query에서 읽음
   - 우선 `GET /app/billing/checkout/{order_no}/status` 폴링
   - 없거나 불확실하면 `GET /app/billing/me` 폴링으로 보조 확인
   - 성공 확정 후 `AuthContext.refresh()`로 권한/플랜 동기화
3) `/billing`
   - `GET /app/billing/me`로 최종 상태 표시(Plan/Subscription/Invoices)

## 2) Usage: /app 공통 429(quota_exceeded) 사용자 UX
- `/app/*` 호출에서 429 발생 시 `ApiErrorView`로 표준 처리
  - `quota_exceeded`: `used/limit/reset_at/Retry-After` 표시 + Upgrade CTA

## 3) Watchlists: 개인 CRUD + 공유 공개 조회
1) 개인(인증 필요)
   - 목록: `GET /app/watchlists`
   - 생성: `POST /app/watchlists`
   - 상세: `GET /app/watchlists/{id}`
   - 아이템 추가/삭제:
     - `POST /app/watchlists/{id}/items`
     - `DELETE /app/watchlists/{id}/items/{symbol}?market=...`
   - 공유 토큰 발급: `POST /app/watchlists/{id}/share`
2) 공개(로그인 불필요)
   - 페이지: `/watchlists/shared/[token]`
   - 호출: `GET /api/watchlists/shared/{token}` (publicClient)

## 4) Dev billing(무인증 mock) — 로컬 테스트 전용
- 페이지: `/dev/billing` (ENV gate)
- 호출: `POST /api/dev/billing/checkout`
  - Next 서버에서만 `DEV_BILLING_TOKEN`을 헤더로 주입하여 백엔드 dev-only 엔드포인트 호출
- 주의: dev token을 브라우저에 노출하지 않는다.

## 5) Onboarding (Week6)
- 페이지: `/onboarding`
- 호출:
  - `GET /app/onboarding` (저장된 step/state)
  - `GET /app/onboarding/summary` (진행률/다음 액션)
  - `PATCH /app/onboarding` (step merge, completed)
  - `POST /app/analytics/event` (전환/완료 이벤트, 실패는 무시)
- UX:
  - 헤더 배너는 로그인 상태에서 온보딩 미완료 시에만 노출(과도한 팝업 금지)

## 6) Search (Week6)
- 헤더 검색 드롭다운:
  - `GET /api/search/trending?range=24h`
- 검색 페이지: `/search?q=...`
  - `GET /api/search?q&types=symbols,posts`
  - (로그인 시) `GET /app/search?type=screeners&q`

## 7) E2E (Week6)
- Playwright:
  - 설치: `npx playwright install --with-deps chromium`
  - 실행(스모크): `npm run test:e2e`
  - 실행(풀 플로우): `E2E_FULL=1 npm run test:e2e`
    - 전제: 백엔드(8001) + MailHog(18025) + mock billing(backend BILLING_* dev 설정) 준비
