# Docs Index (frontend)

## Read order (새 채팅 주입 기준)
1) `docs/CONTEXT.md` (항상)
2) `docs/RECENT.md` (항상)
3) `docs/ENV.md` (실행/배포/프록시/URL 문제)
4) `docs/I18N.md` (번역/키 노출 문제)
5) `docs/ERROR_UX.md` (에러/사용자 행동/장애 UX)
6) `docs/UI_GUIDE.md` (페이지/컴포넌트 스타일 정합)
7) `docs/WORKFLOWS.md` (결제/청구/사용량/워치리스트 플로우)

## Source of truth (충돌 시 우선순위)
1) 프론트 코드(`src/*`)
2) 백엔드 계약/정책(`backend/docs/CONTRACTS.md`, `backend/docs/WORKFLOWS.md`)
3) 이 폴더의 문서
4) `README.md`(빠른 실행)

## Update triggers (문서 갱신 규칙)
아래 변경이 있으면 관련 문서를 함께 갱신한다.
- 라우트/페이지 추가/삭제: `src/app/**` → `docs/CONTEXT.md`, `docs/WORKFLOWS.md`
- API base URL/프록시/토큰 처리 변경: `src/lib/*Client.ts`, `src/app/api/**` → `docs/ENV.md`
- i18n 설정/리소스 구조 변경: `src/i18n/**` → `docs/I18N.md`
- 에러 처리/문구/코드 매핑 변경: `src/components/common/ApiErrorView.tsx` → `docs/ERROR_UX.md`
- UI 스타일/버튼/카드 공통 패턴 변경: `src/components/**` → `docs/UI_GUIDE.md`

## Prompt templates (AI 작업 지시용)
새 채팅에서 최소로 붙일 것:
- `docs/CONTEXT.md`
- `docs/RECENT.md`
(인터페이스 변경이 필요하면) `backend/docs/CONTRACTS.md`도 함께

요청 템플릿:
```
목표(1줄):
수정 범위(파일/폴더):
금지사항(있으면):
성공 조건(3개 이내):
참고(문서 섹션/로그/재현 커맨드):
```

