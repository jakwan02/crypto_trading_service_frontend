# Error UX 설계(프론트)

## 목표
- 사용자에게는 “무슨 일이 발생했는지 + 다음 행동(CTA)”만 제공한다.
- 서버의 `code/message/meta`는 **PROD에서 그대로 노출하지 않는다**.

## Source of truth
- 공통 에러 뷰: `src/components/common/ApiErrorView.tsx`
- 에러 파싱:
  - `/app`(인증): `src/lib/appClient.ts` (Retry-After 포함)
  - `/api`(공개): `src/lib/publicClient.ts` (Retry-After 포함)
- 에러 유틸: `src/lib/apiErr.ts`

## 공통 규칙(강제)
1) 페이지/컴포넌트에서 `error.message`를 그대로 렌더링하지 않는다.
2) 에러 화면은 가능한 한 `ApiErrorView`로 수렴시킨다.
3) PROD에서는 디버그(상태/코드/메타)를 숨기고, DEV에서만 `<details>`로 제공한다.

## 표준 케이스(최소)
- 401 Unauthorized
  - “로그인이 필요합니다” + 로그인 버튼(`/login?next=...`)
- 409 Conflict (`active_entitlement_exists`)
  - “이미 이용 중입니다” + Billing 이동 CTA
- 429 Rate limit / Quota exceeded
  - `quota_exceeded`는 `used/limit/reset_at/Retry-After`를 함께 표시 + Usage/Upgrade CTA
- Billing 옵션 불일치(400)
  - `unsupported_provider_for_kind`
  - `unsupported_currency_for_provider`
  - `origin_not_allowed`
  - `invalid_path`
  - `unsupported_plan_change`
  - 모두 사용자 친화 문구로 매핑 + 재시도/Upgrade/Billing CTA

## UI 상호작용(체감 성능/실수 방지)
- “즉시 반영”이 중요한 토글은 optimistic update를 사용하고 실패 시 롤백한다.
  - 예: 즐겨찾기 별 토글 `src/components/watchlists/FavoriteStar.tsx`
- 클릭 가능한 행(Row) 안의 버튼은 버블링으로 라우팅을 트리거하지 않게 한다.
  - 예: `stopPropagation()`/`preventDefault()` 적용

