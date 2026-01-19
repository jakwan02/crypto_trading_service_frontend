# UI 가이드(프론트 스타일/정합)

## 목표
- 페이지가 늘어나도 “카드/버튼/테이블/폼”의 시각 언어를 유지한다.
- 신규 페이지는 기존 Week2 페이지 스타일을 기준으로 확장한다.

## 기본 레이아웃(권장)
- 페이지 루트:
  - `main` + `min-h-screen bg-transparent`
- 컨테이너:
  - `mx-auto w-full max-w-6xl px-4 py-10`
- 헤더(타이틀/설명):
  - 타이틀: `text-2xl font-semibold text-gray-900`
  - 설명: `mt-1 text-sm text-gray-500`

## 카드(공통)
- 기본 카드:
  - `rounded-3xl border border-gray-200 bg-white p-6 shadow-sm`
- 강조 카드(예: 성공):
  - `border-emerald-200 bg-emerald-50`
- 경고 카드(예: past_due):
  - `border-amber-200 bg-amber-50`

## 버튼(공통)
- Primary
  - `rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark`
- Secondary
  - `rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary`
- Destructive(삭제 등)
  - `rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-red-300 hover:text-red-600`
- Disabled
  - `disabled:bg-gray-200 disabled:text-gray-500` 또는 `disabled:bg-gray-300`

## 폼(공통)
- Input/Select
  - `rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700`
- Textarea
  - `rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700`

## 테이블(공통)
- 컨테이너:
  - `overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm`
- 헤더:
  - `bg-gray-50` + `text-xs font-semibold text-gray-600`
- Empty row:
  - `px-4 py-10 text-center text-sm text-gray-500`

## 페이지 확장 규칙(강제)
1) 신규 페이지는 기존 스타일 토큰(카드/버튼/테이블/폼)을 그대로 사용한다.
2) 문자열은 i18n 키로 추가하고(ko/en 동시), 하드코딩 영문을 남기지 않는다.
3) 에러는 `ApiErrorView`로 통일하고 서버 원문을 그대로 출력하지 않는다.

