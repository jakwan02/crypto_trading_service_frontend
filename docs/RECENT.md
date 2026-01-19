# Recent Changes (frontend, rolling)

> 규칙: 최신 30개까지만 유지. 오래된 항목은 아래로 밀고 제거.
> 항목 1개는 2~4줄 이내로 압축(무조건).

## 2026-01-19
- [week4/frontend] Pricing/Status/Changelog/Support/Legal(CookieBanner) + Admin UI(/admin/*) 구현(Week4 설계 반영)
  - impact: `/pricing`, `/status`, `/changelog`, `/support`, `/cookies`, `/disclaimer` 및 `/terms`/`/privacy`가 백엔드 Week4 계약(/api/*,/app/*) 기반으로 동작
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
