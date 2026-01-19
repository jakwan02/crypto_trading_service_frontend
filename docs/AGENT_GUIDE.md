# Agent Guide (frontend)

> 이 문서는 “프론트 확장 시 정합성/UX/i18n/에러 처리”를 깨지 않기 위한 고정 규칙이다.
> 충돌 시 우선순위: 코드 > 백엔드 계약(backend/docs/CONTRACTS.md) > 이 문서.

## 0) 기본 원칙(강제)
1) **서버 메시지/코드 그대로 노출 금지(PROD)**
   - `error.message`, `error.code`, raw payload를 화면에 직접 출력하지 않는다.
   - 표준 처리: `src/components/common/ApiErrorView.tsx`의 코드→문구/CTA 매핑으로 흡수한다.

2) **i18n 정합(키 노출 재발 방지)**
   - i18n key는 `<namespace>.<keyPath>` 이며, namespace는 locale 파일 최상위 키다.
   - init.ns는 `resources.ko` 기반 자동 구성(누락 방지) → 하드코딩 ns 목록으로 회귀 금지.
   - 신규 UI 문구는 ko/en 동시 추가(키 누락 금지).

3) **페이지/컴포넌트 스타일 정합**
   - 신규 페이지는 `docs/UI_GUIDE.md`의 카드/버튼/테이블/레이아웃 토큰을 그대로 사용한다.
   - “예외 스타일”이 필요하면 공통 컴포넌트로 승격해 중복을 만들지 않는다.

4) **결제/권한은 서버 SoT**
   - 결제 성공은 리다이렉트 결과가 아니라 `/app/billing/checkout/*/status` 또는 `/app/billing/me`로 확정한다.
   - 상태 확정 후 `AuthContext.refresh()`로 권한을 동기화한다.

5) **느린 UX는 optimistic으로 개선**
   - 토글(즐겨찾기 등)은 optimistic update + 실패 롤백을 기본으로 한다.

## 1) 문서 사용 규칙
- 새 작업 시작:
  - `docs/CONTEXT.md`, `docs/RECENT.md`
- URL/프록시/WS 문제:
  - `docs/ENV.md` + `backend/docs/reverse_proxy_caddy.md`
- i18n 문제:
  - `docs/I18N.md`
- 에러 UX:
  - `docs/ERROR_UX.md`
- 결제/사용량/워치리스트 흐름:
  - `docs/WORKFLOWS.md`

## 2) 변경 체크리스트(작업 종료 시)
- i18n 키 추가/변경이 있으면:
  - `src/i18n/locales/ko.ts`, `src/i18n/locales/en.ts` 동시 반영
  - `docs/I18N.md` 갱신 필요 여부 확인
- 에러 UX 변경이 있으면:
  - `docs/ERROR_UX.md` 갱신
- base URL/WS URL 처리 변경이 있으면:
  - `docs/ENV.md` 갱신
- `codex_log.md` 템플릿대로 append

## Appendix) 매 채팅 시작 지침(고정) v4 (copy/paste)

[필수]
- 한국어로 답변하세요.
- 내 질문/요구사항에 대한 **정확한 답변만** 제공(불필요한 설명/반복 최소화).
- **추측 금지**: 레포 내부 근거가 없으면 먼저 레포에서 확인하고, 레포 밖(운영/네트워크/실행 결과)에서만 “근거 부족” 사용.
- **한 가지 최선안만** 제시(대안 나열 금지).

[프로젝트 정합성(기업급, 강제)]
- **기존 실행 중 로직 삭제/축약 금지(기본)**: “잘못돼 보이는 로직”도 임의 삭제/축약/기능 제거 금지. 필요 시 **추가(append) + 호환 유지 + 점진 전환**으로 처리.
- 백엔드: DB/스냅샷/Redis/Streams/모니터링은 가용성 우선. DB 폭주/락/연결 고갈/키 폭증/복구 루프 폭주를 유발하는 변경 금지.
- 프론트: 페이지/스타일 정합성 유지, i18n(ko/en) 누락 금지, **서버 응답/에러 원문을 사용자에게 그대로 노출 금지(PROD)**, 모든 경우의 수(성공/실패/대기/제한/권한)를 사용자 친화 UX로 처리.
- 설계/계약과 구현의 정합을 유지: 계약/흐름 변경 시 문서/타입/UX까지 함께 갱신.

[기본 컨텍스트(토큰 절약)]
- 작업 대상 repo 기준으로 해당 `docs/CONTEXT.md + docs/RECENT.md`를 기본 컨텍스트로 사용.
  - backend: `backend/docs/CONTEXT.md`, `backend/docs/RECENT.md`
  - frontend: `frontend/docs/CONTEXT.md`, `frontend/docs/RECENT.md`
- 추가 탐색은 꼭 필요한 범위로만. 필요 시 “왜 필요한지 + 필요한 파일/함수” 1줄 먼저 말한 뒤 진행.
- 인터페이스(WS/REST/Redis/DB) 변경이면 `backend/docs/CONTRACTS.md`만 추가로 참조.
- 데이터/운영 흐름 변경이면 `backend/docs/WORKFLOWS.md`(+ 필요 시 `frontend/docs/WORKFLOWS.md`)만 추가로 참조.
- URL/Caddy/env 드리프트 이슈면 `backend/docs/reverse_proxy_caddy.md`, `backend/docs/env_files_policy.md`, `frontend/docs/ENV.md`를 우선 참조.

[증거/확인 방식]
- 레포 안에 있는 정보는 내가 직접 확인합니다. “파일 전체 붙여넣기” 요구 금지.
- “근거 부족” 전에 레포 내부 근거를 먼저 소진하세요.
- 레포 밖 확인이 필요하면 질문/실행 요청은 최소(질문 1개, 실행 1개, 로그 10~30줄).

[작업 규칙]
- 내가 지정한 파일/폴더 범위만 수정. 범위 확장이 필요하면 **사전 확인(1문장)** 후 진행.
- 의존성 추가는 정말 필요할 때만(필요 시 설치/적용 커맨드 포함).
- env 변경이 있으면 backend는 `.env/.env.example/.env.docker/.env.docker.example` **4개를 동일 구조로 동시 갱신**(문서: `backend/docs/env_files_policy.md`).

[Codex 실행 정책]
- 내가 실행할 수 있도록 “필요 최소 명령/SQL/검증 절차”만 제시.
- 검증은 내가 직접 실행(실패 시 핵심 에러 10~30줄만 전달).

[승인(동의) 요청 규칙]
- 아래가 필요하면 즉시 중단하고 “승인 요청 메시지” 먼저 출력:
  - 파일 삭제
  - 모듈 분리/대규모 이동
  - 대규모 구조 변경
  - 기존 로직 삭제/축약(기능 제거 포함)
  - 수정 범위 확대(지정 범위 밖 수정)
  - DB 스키마/Alembic 마이그레이션 추가(또는 다운타임/부하 위험 작업)
- 승인 요청 메시지 형식:
  1) 왜 필요한가(근거 1~2줄: 코드 위치/문서/로그)
  2) 무엇을 바꾸는가(정확한 파일/변경 요약 3줄 이내)
  3) 영향(리스크/롤백 포인트 2줄 이내)
  4) 내가 “승인”이라고 답하면 진행, 아니면 현재 범위 내 최선안으로만 진행

[코드/출력 방식]
- 기본 응답은 “패치(변경 부분 중심)”.
- 변경 이유는 변경 지점 위에 `# 변경 이유:` 1~2줄만(장문 금지).

[운영/배포(도커)]
- 도커 재빌드/재기동/프로파일/마이그레이션이 필요/권장되면, 내가 실행할 정확한 명령어를 원문 그대로 포함.
- 불필요하면 “도커 재빌드/재기동: 불필요(이유 1줄)” 명시.
- 데이터 유실 위험 작업은 사전 경고 후 커맨드 제시.

[매 채팅 종료 체크리스트]
- (코드 변경) 영향 범위 문서만 갱신: CONTRACTS/WORKFLOWS/RECENT/INDEX/ADR/README
- `codex_log.md`는 템플릿대로 append만(기존 내용 수정 금지)
- 검증 커맨드/상태 샘플 최소 첨부 + git commit 메시지 1줄 제안
