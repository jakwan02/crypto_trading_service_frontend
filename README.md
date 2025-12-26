# CoinDash Frontend

AI 기반 코인 정보 서비스의 프론트엔드입니다. Next.js App Router 기반으로 실시간 시세, 차트, 알림, AI 인사이트 화면을 제공합니다.

## Features

- 마켓 개요, 차트, 알림, 뉴스, AI 인사이트 페이지 구성
- 실시간 심볼 데이터 (REST + WS)와 차트 히스토리 로딩
- Spot/UM 마켓 전환, 심볼 검색/필터
- 반응형 UI, 라이트 테마 기반 디자인
- Google OAuth (Supabase) 로그인 구조

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

필수 (시세/차트 데이터):

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_WS_BASE_URL`

선택 (Google OAuth - Supabase):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

선택 (API/WS 토큰 보호 사용 시):

- `NEXT_PUBLIC_API_TOKEN`
- `NEXT_PUBLIC_WS_TOKEN`

선택 (모니터링 - Sentry):

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` (소스맵 업로드 시)

Supabase 변수가 없으면 Google 로그인이 비활성화되며, UI는 그대로 렌더됩니다.

## Tests

```bash
npm run test
```
