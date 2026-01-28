# CoinDash Frontend

AI 기반 코인 정보 서비스의 프론트엔드입니다. Next.js App Router 기반으로 실시간 시세, 차트, 알림, AI 인사이트 화면을 제공합니다.

## Features

- 마켓 개요, 차트, 알림, 뉴스, AI 인사이트 페이지 구성
- 실시간 심볼 데이터 (REST + WS)와 차트 히스토리 로딩
- Spot/UM 마켓 전환, 심볼 검색/필터
- 반응형 UI, 라이트 테마 기반 디자인
- 이메일/비밀번호 + Google OIDC 로그인 구조

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

필수 (시세/차트 데이터):

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_WS_BASE_URL`

선택 (Google OIDC):

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

선택 (개발용 Mock 결제 테스트):

- `NEXT_PUBLIC_ENABLE_DEV_BILLING` (`1`이면 `/dev/billing`, `/api/dev/billing/checkout` 활성화; production에서는 404)
- `DEV_BILLING_TOKEN` (server-only: 백엔드로 `X-Dev-Token` 주입)
- `API_PROXY_TARGET` (선택: 백엔드 base URL, 예: `http://localhost:8001`)

선택 (모니터링 - Sentry):

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` (소스맵 업로드 시)

Google OIDC 클라이언트 ID가 없으면 Google 로그인이 비활성화됩니다.

## Docs
- `docs/INDEX.md` (프론트 문서 인덱스/읽는 순서)
- `docs/ENV.md` (base URL/WS URL/Caddy 단일 오리진 설정)
- `docs/I18N.md` (i18n namespace 구조/키 노출 재발 방지)
- `docs/ERROR_UX.md` (서버 메시지 노출 금지/에러 UX 표준)
- `docs/UI_GUIDE.md` (페이지/버튼/카드 스타일 정합)

## Tests

```bash
npm run test
```
