# Recent Changes (frontend, rolling)

> 규칙: 최신 30개까지만 유지. 오래된 항목은 아래로 밀고 제거.
> 항목 1개는 2~4줄 이내로 압축(무조건).

## 2026-01-19
- [i18n] namespace 누락으로 `billing.title` 등 키가 그대로 노출되던 문제를 ns 자동 구성으로 방지 + Week2 화면 ko 문구 정리
  - why: 신규 namespace(billing/usage/watchlists/errors/devBilling) 추가 시 init.ns 누락으로 번역이 깨지는 재발 방지
  - impact: `/upgrade` 플랜 카드/`/billing`/`/usage`/`/watchlists` 텍스트 정합 및 마켓 표기(현물/선물) 개선
- [docs] `docs/AGENT_GUIDE.md`에 “매 채팅 시작 지침 v4” copy/paste 블록 추가
  - impact: 프론트/백엔드 공통 정합 규칙을 채팅 단에서 고정해 재발성 이슈(i18n/UX/env 드리프트) 방지

## 2026-01-18
- [week2] Billing/Usage/Watchlists/Upgrade/Return 페이지 도입 + dev billing(/dev/billing) 플로우 추가
  - why: 백엔드 Week2 계약(redirect checkout, invoices, quota, share/public)을 프론트에 연결
  - impact: `/upgrade→/billing/return→/billing` 플로우, `/watchlists/shared/[token]` 공개 페이지 제공
