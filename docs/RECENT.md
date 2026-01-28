# Recent Changes (frontend, rolling)

> 규칙: 최신 30개까지만 유지. 오래된 항목은 아래로 밀고 제거.
> 항목 1개는 2~4줄 이내로 압축(무조건).

## 2026-01-28
- [security/design2] 브라우저 공유 시크릿(NEXT_PUBLIC_API_TOKEN/NEXT_PUBLIC_WS_TOKEN) 제거 + 공용 Markdown 렌더러(validateLink/rel)로 XSS 링크 스킴 보강 + verify/reset 쿼리 토큰 즉시 제거 + Next 보안 헤더(보조)
  - impact: 번들 시크릿 노출/쿼리 토큰 referrer 유출/XSS 링크 스킴 리스크 완화(계약 변경)

## 2026-01-23
- [ops/env] 배포용 `.env.production.example` 추가(+ `.env.production`은 VPS에서 생성) + 도커 빌드에서 `.env.local` 제외(.dockerignore)로 로컬/배포 env 드리프트 방지(HTTPS OFF 전제)
  - impact: VPS 도커 빌드에서 local env(localhost)가 섞여 배포 번들이 잘못되는 문제 차단, 운영 WS base는 `http://<host>`로 통일
- [seo] sitemap/robots의 기본 proto를 http로 정합화(프록시 헤더 없을 때도 HTTPS 강제 출력 방지)
  - impact: HTTPS 미구성 시에도 robots/sitemap URL이 http로 생성

## 2026-01-24
- [ops/http] 운영 WS base를 `https://<host>`로 정합(프론트는 `wss://`로 변환) + env 예시 갱신
  - impact: Caddy HTTPS 환경에서 WS가 mixed content 없이 `wss://<host>/ws_*`로 연결
- [ux/mobile] Market/Overview(SymbolTable) 모바일 3컬럼 요약 뷰로 전환(가로 스크롤 제거) + chart 제스처 충돌 완화 + dvh 보정
  - impact: 모바일에서 심볼/가격/변동/거래량 정보를 한 화면에 표시, pinch/브라우저 줌 충돌 완화, 주소창 변화로 인한 화면 흔들림 감소
- [chart] WS/캐시 스냅샷 갭 방지(연속성 강제) + 갭 발생 시 서버 스냅샷 재동기화
  - impact: 5m 등에서 “20→30”처럼 캔들이 건너뛰어 빈 구간이 보이는 현상 방지, 누락 캔들이 늦게 와도 보류→즉시 반영으로 지표 뒤틀림 완화

## 2026-01-27
- [ops/http] 운영 호스트를 `159.195.28.57.nip.io`로 고정(공인 HTTPS 호스트 정합)
  - impact: `NEXT_PUBLIC_WS_BASE_URL`/`API_PROXY_TARGET`가 공인 HTTPS 호스트로 일치해 mixed content/인증서 경고 리스크 감소
- [fix/ux] LanguageSwitcher를 KR/US/JP/DE 단일 텍스트로 통일 + 선택/드롭다운 텍스트 굵기 정합화
  - impact: KR에서 US/JP/DE 중복 표시(얇음+굵음 겹침) 제거, 선택된 텍스트도 굵게 표시
- [fix/ux] /settings 404 호환 리다이렉트(/account/settings) 추가 + Admin Users에 active/inactive/deleted 상태 탭/컬럼 추가
  - impact: 온보딩 CTA "다음 단계" 404 제거, 탈퇴 계정과 비활성 계정 구분 가능
- [ops/ux] cm(coin-m) 마켓의 메뉴/기능 제거 + 모니터링/워치리스트/캘린더에서 cm 노출 차단
  - impact: 관리 심볼이 아닌 cm이 UI에 나타나거나 선택/필터되는 경로 제거(spot/um만 유지)
- [chart/perf] 차트 초기 번들을 현재 TF만 요청(tfs) + per-symbol lastBundleAt reset으로 IDB 스냅샷 즉시 렌더 안정화
  - impact: 초기 로딩 payload/파싱량↓, 심볼 전환/재방문 시 로딩 편차↓
- [chart/nav] 차트 헤더에 이전/다음 심볼(순환) 네비 + 인접 심볼 번들 prefetch
  - impact: 마켓 오버뷰 정렬 기준으로 좌/우 이동, 연속 탐색 지연↓

## 2026-01-22
- [ux/frontend] 헤더 1줄 그리드 고정(h-16) + Desktop 네비(Primary/기능/더보기) 드롭다운 분리 + 모바일 드로어(overlay/scroll/ESC/focus/scroll-lock) 표준화
  - impact: 데스크탑/모바일에서 헤더 레이아웃 붕괴 방지, 모바일 메뉴 오버레이/스크롤/닫기 동작 일관화
- [fix/frontend] 모바일 드로어 포탈 렌더링이 hydration mismatch를 유발하던 문제를 hydration 이후 mount로 정합화 + body scroll-lock 시 scrollbar 폭 보정(padding-right) 적용
  - impact: DEV에서 Hydration failed 오류 제거, 드로어 오픈/클로즈 시 레이아웃 흔들림 완화
- [ux/i18n] 상단 네비 IA를 Primary/Features/More로 확정(계정성 Billing/Usage는 계정 섹션으로 이동) + nav.features 키를 ko/en/ja/de에 보강
  - impact: 헤더 혼잡/줄바꿈 리스크 감소, 다국어에서 “features” 라벨 키 노출 방지

## 2026-01-21
- [e2e/frontend] fullflow(E2E_FULL=1) MailHog 토큰 추출(base64 MIME) 보강 + 포트폴리오 입력(testid) 추가로 E2E 안정화
  - impact: signup→verify→mock upgrade/cancel→watchlists/alerts/portfolio 풀 플로우가 환경 의존 없이 통과
- [fix/frontend] Next 16에서 `/search`의 `searchParams` Promise 접근 오류를 async/await로 정합화
  - impact: `/search` 런타임 에러 제거(DEV/PROD), smoke 테스트 노이즈 제거
- [ux/frontend] 헤더 네비를 Primary/기능/더보기로 재구성 + 헤더 컨트롤 높이(h-10) 표준화로 정렬/반응형/대비 개선
  - impact: 상단 메뉴 줄바꿈/세로 텍스트 방지, 모바일 드로어 검색 포함, hover/active 대비 및 포커스 접근성 향상

## 2026-01-20
- [week6/frontend] 온보딩 진행바/배너 + 전역 검색(/search) + OG 이미지 + 콘텐츠 추천/관련 노출 + Trace ID 헤더 + Playwright E2E 추가
  - impact: Header 검색 드롭다운/온보딩 배너, 신규 라우트 `/search`, `/opengraph-image`, E2E(`playwright.config.ts`, `e2e/*`)
- [week6/e2e] `NEXT_PUBLIC_API_BASE_URL=/` 정합 + Playwright 풀 플로우(E2E_FULL=1) 추가
  - impact: MailHog 기반 이메일 인증 + mock upgrade/cancel + watchlists/alerts/portfolio 시나리오를 선택적으로 자동화

## 2026-01-19
- [week5/frontend] Admin 운영 콘솔 확장(/admin dashboard/users/billing/monitoring/growth/calendar/audit) + Growth/Dev/SEO(/referral,/onboarding,/developer,/rankings,sitemap/robots) 반영
  - impact: Week5 신규 라우트/헤더 메뉴/i18n(ko/en) 연결 완료(백엔드 Week5 계약 기준)
- [week4/frontend] Pricing/Status/Changelog/Support/Legal(CookieBanner) + Admin UI(/admin/*) 구현(Week4 설계 반영)
  - impact: `/pricing`, `/status`, `/changelog`, `/support`, `/cookies`, `/disclaimer` 및 `/terms`/`/privacy`가 백엔드 Week4 계약(/api/*,/app/*) 기반으로 동작
- [ux/auth] Google 로그인 인라인 오류 메시지 i18n(ko/en) 적용 + PROD에서 내부/원문 노출 방지
  - impact: 설정 누락/스크립트 실패 시에도 사용자에게는 친화 메시지만 노출(개발 환경만 상세 표시)
- [week3/frontend] Screener/Alerts/Portfolio/Research UI를 백엔드 Week3 계약(/app,/api) 기반으로 구현 + 웹푸시 SW/텔레그램 게이트 추가
  - impact: `/screener`, `/alerts`, `/portfolio`, `/research` 라우트 동작 및 차트 보조지표(RSI/MACD/BB) 표시가 브라우저 계산으로 전환됨
- [chart] 캔들 아래 보조지표 패널(Volume/RSI/MACD) + BB 오버레이 + 사용자 설정(LocalStorage) 추가
  - impact: `/chart/[symbol]`에서 바이낸스/TradingView 스타일로 멀티 패널 지표 차트를 제공(서버 부하 증가 없음)
- [i18n] namespace 누락으로 `billing.title` 등 키가 그대로 노출되던 문제를 ns 자동 구성으로 방지 + Week2 화면 ko 문구 정리
  - why: 신규 namespace(billing/usage/watchlists/errors/devBilling) 추가 시 init.ns 누락으로 번역이 깨지는 재발 방지
  - impact: `/upgrade` 플랜 카드/`/billing`/`/usage`/`/watchlists` 텍스트 정합 및 마켓 표기(현물/선물) 개선
- [docs] `docs/AGENT_GUIDE.md`에 “매 채팅 시작 지침 v5” copy/paste 블록 고정(응답 포맷/증거/검증 흐름 포함)
  - impact: 프론트/백엔드 공통 정합 규칙 + 결과물 형식을 단일 SOT로 고정해 재발성 이슈(i18n/UX/env 드리프트) 방지
- [ux] 헤더 드롭다운(알림/계정) 바깥 클릭/ESC 닫힘 처리 + SymbolTable 스크롤바 거터 고정으로 정렬 틀어짐 완화
  - impact: 탭/메뉴가 화면에 남는 UX 문제 해결, 테이블 헤더/바디 좌우 정렬 안정화
- [ux] /market SymbolTable 가상 스크롤 row height 정합화(고정 높이)로 행 여백 어긋남 완화
  - impact: 심볼 행의 위/아래 여백이 들쭉날쭉해 보이는 현상 완화

## 2026-01-18
- [week2] Billing/Usage/Watchlists/Upgrade/Return 페이지 도입 + dev billing(/dev/billing) 플로우 추가
  - why: 백엔드 Week2 계약(redirect checkout, invoices, quota, share/public)을 프론트에 연결
  - impact: `/upgrade→/billing/return→/billing` 플로우, `/watchlists/shared/[token]` 공개 페이지 제공
