# Codex Work Log

- 규칙: 작업 종료 시 반드시 아래 템플릿으로 append
## 2025-12-30 06:42 (local)
- Task: 차트 좌측 자동 로드 로직 삭제
- Scope: src/components/ChartContainer.tsx, codex_log.md
- Why: 의도하지 않은 과거 차트 자동 로드를 제거하고 수동 로드만 유지
- Key changes:
  - 좌측 스크롤 자동 로드용 range 구독 및 refs 제거
  - 자동 로드 트리거 해제하고 수동 loadMore 버튼만 유지
  - 관련 초기화 로직 정리
- Commands run:
  - npm run lint -> 실패 (기존 lint 오류: Date.now purity, useEffect deps)
- Logs/Artifacts:
  - console: npm run lint 출력
- Next:
  - lint 오류 해결 후 npm run lint 재실행
  - 브라우저에서 좌측 이동 시 자동 로드 미발생 확인

## 2026-01-04 12:22 (local)
- Task: market bootstrap/page + 가시영역 WS 구독/가상 스크롤 적용
- Scope: src/hooks/useMarketSymbols.ts, src/components/SymbolTable.tsx, src/app/market/page.tsx, codex_log.md
- Why: 초기 30개 1 RTT 렌더와 스크롤 증분 로딩, WS 비용을 가시영역으로 제한
- Key changes:
  - market 부트스트랩/페이지 + WS 스왑 전용 훅 추가
  - SymbolTable 가상 스크롤 + 배치 재정렬 + 가시영역 WS 구독 적용
  - market 필터에서 null metrics 안전 처리
- Commands run:
  - none
- Logs/Artifacts:
  - none
- Next:
  - market 페이지 스크롤/윈도우 변경/새로고침 WS 갱신 확인
  - /api/market/bootstrap/page 응답과 연동 확인

## 2026-01-04 12:28 (local)
- Task: useMarketSymbols 경로 정리 및 시간 파싱 보강
- Scope: src/hooks/useMarketSymbols.ts, codex_log.md
- Why: 훅을 프론트 경로로 이동하고 날짜 문자열을 ms로 통일
- Key changes:
  - useMarketSymbols를 frontend/src/hooks로 이동
  - time/onboardDate 파싱에 toMs 추가
- Commands run:
  - none
- Logs/Artifacts:
  - none
- Next:
  - market 페이지 WS/스크롤 동작 재확인
  - 타입 오류 여부 체크

## 2026-01-04 12:46 (local)
- Task: SymbolTable ReferenceError 수정
- Scope: src/components/SymbolTable.tsx, codex_log.md
- Why: useEffect 루프에서 sym 중복 선언으로 런타임 오류 발생
- Key changes:
  - renderOrder 루프의 sym 재선언 제거
- Commands run:
  - none
- Logs/Artifacts:
  - none
- Next:
  - market 페이지 렌더/WS 갱신 재확인

## 2026-01-04 12:51 (local)
- Task: market 테이블 컬럼 겹침 수정
- Scope: src/components/SymbolTable.tsx, codex_log.md
- Why: 가상 스크롤 테이블에서 컬럼 폭/오버플로가 고정되지 않아 텍스트가 겹침
- Key changes:
  - 컬럼별 고정 폭과 truncate 적용
  - 테이블 최소 폭 확대
- Commands run:
  - none
- Logs/Artifacts:
  - none
- Next:
  - 마켓 페이지 렌더링에서 겹침 해소 확인

## 2026-01-04 12:55 (local)
- Task: market 테이블 컬럼 비율 재조정
- Scope: src/components/SymbolTable.tsx, codex_log.md
- Why: 헤더/본문 컬럼 비율 불일치로 가독성이 저하됨
- Key changes:
  - 컬럼 폭을 비율 기반으로 변경하고 min width 유지
- Commands run:
  - none
- Logs/Artifacts:
  - none
- Next:
  - market 화면에서 컬럼 비율 확인

## 2026-01-04 13:00 (local)
- Task: market 테이블 헤더/바디 컬럼 정렬 고정
- Scope: src/components/SymbolTable.tsx, codex_log.md
- Why: thead/tbody 레이아웃 분리로 헤더와 바디 컬럼이 어긋남
- Key changes:
  - 헤더/행 모두 동일한 grid template 적용
  - tbody width 고정 및 셀 스타일 정리
- Commands run:
  - none
- Logs/Artifacts:
  - none
- Next:
  - market 화면에서 헤더/바디 정렬 확인

## 2026-01-04 13:13 (local)
- Task: market 테이블 스크롤 경고/행 간격 보정
- Scope: src/components/SymbolTable.tsx, codex_log.md
- Why: react-virtual flushSync 경고와 테이블 기본 border-spacing으로 행 간격 불균형 발생
- Key changes:
  - observeElementOffset 래핑으로 isScrolling=false 처리
  - row estimate 조정 및 border-collapse 적용
- Commands run:
  - none
- Logs/Artifacts:
  - none
- Next:
  - 스크롤 시 콘솔 경고와 행 간격 확인
2026-01-05 02:17 (local)
Task: WS replace 전환 + market 서버 정렬/검색 + 차트 최소 fetch
Scope: src/hooks/useMarketSymbols.ts, src/hooks/useSymbols.ts, src/hooks/useChart.ts, src/components/SymbolTable.tsx, codex_log.md
Why: WS 재연결 없이 구독 변경하고 전 심볼 정렬/검색 및 로딩 지연을 완화
Key changes:
- ws_rt replace 기반으로 연결 유지 및 재연결 버그 수정
- market 정렬/검색 서버화 + scope UI 추가
- 차트/심볼 fetch 범위 축소 및 flush 주기 상향
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 프론트/백 통합 확인 및 빌드/스모크 테스트
2026-01-05 02:23 (local)
Task: useSymbols 훅 useCallback import 보완
Scope: src/hooks/useSymbols.ts, codex_log.md
Why: useCallback 사용에 맞게 React import 누락을 보완
Key changes:
- useCallback 추가 import
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 없음
2026-01-05 02:30 (local)
Task: 변경 이유 주석 추가(차트/심볼 훅)
Scope: src/hooks/useSymbols.ts, src/hooks/useChart.ts, codex_log.md
Why: 사용자 규칙(변경 이유 주석) 준수
Key changes:
- 파일 상단에 변경 이유 주석 추가
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 없음
2026-01-05 03:35 (local)
Task: WS URL 조립/토큰 선택 로직 정합화
Scope: src/hooks/useMarketSymbols.ts, src/hooks/useSymbols.ts, src/hooks/useChart.ts, codex_log.md
Why: Caddy 경로/포트 규약과 WS 토큰 정책 불일치 해소
Key changes:
- WS_BASE_URL을 그대로 사용하고 포트/프리픽스 추론 제거
- WS 토큰은 API 토큰을 우선 사용
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 프론트 env의 API/WS base 및 토큰 일치 확인
2026-01-05 03:59 (local)
Task: WS URL에 query token 추가 및 WS base 정합화
Scope: src/hooks/useMarketSymbols.ts, src/hooks/useSymbols.ts, src/hooks/useChart.ts, codex_log.md
Why: WS 토큰 전달 누락/불일치로 인한 조기 close 방지
Key changes:
- ws_rt/ws_chart URL에 token 쿼리 파라미터 추가
- WS_BASE_URL 변형 로직 제거 유지
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- WS 접속 성공 여부 확인
2026-01-05 05:37 (local)
Task: WS 토큰 우선순위 수정 및 프론트 토큰 동기화
Scope: src/hooks/useMarketSymbols.ts, src/hooks/useSymbols.ts, src/hooks/useChart.ts, .env, .env.local, codex_log.md
Why: WS 토큰 불일치로 핸드셰이크 직전 종료 문제 완화
Key changes:
- WS URL/프로토콜에서 WS_TOKEN 우선 사용
- 프론트 NEXT_PUBLIC_*_TOKEN 값을 백엔드 토큰과 정합화
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 프론트 재빌드 후 WS 연결 확인
2026-01-05 05:46 (local)
Task: WS subprotocol 기본 비활성화 및 환경 플래그 추가
Scope: src/hooks/useMarketSymbols.ts, src/hooks/useSymbols.ts, src/hooks/useChart.ts, codex_log.md
Why: 프록시 환경에서 subprotocol 미선택 시 핸드셰이크 실패를 방지
Key changes:
- NEXT_PUBLIC_WS_SUBPROTO=1일 때만 subprotocol 요청
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 프론트 재빌드 후 WS 연결 확인
2026-01-05 07:07 (local)
Task: SPA 진입 실시간/차트 스냅샷/증분 로딩 안정화
Scope: src/hooks/useChart.ts, src/hooks/useSymbols.ts, src/components/SymbolTable.tsx, codex_log.md
Why: 페이지 이동 후 WS 연결/차트 초기 데이터/페이징이 멈추는 문제 해결
Key changes:
- dev 스킵 제거로 ws_rt/ws_chart 첫 연결 보장
- chart REST 스냅샷 time 파싱 보강(ISO 문자열 지원)
- market 테이블 하단 감시로 loadMore 트리거 안정화
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 프론트 재시작 후 실시간/차트/페이징 동작 확인
2026-01-05 08:19 (local)
Task: SPA 이동 후 WS/차트/마켓 실시간 안정화
Scope: src/hooks/useChart.ts, src/hooks/useSymbols.ts, src/hooks/useMarketSymbols.ts, src/components/SymbolTable.tsx, src/app/chart/[symbol]/SymbolChartClient.tsx, codex_log.md
Why: 버튼 이동 후 WS 끊김/market 불일치/플래시 갱신 누락을 해소
Key changes:
- closedRef 재설정으로 재마운트 시 재연결 허용
- 차트 진입 시 market 쿼리 반영 및 링크에 market 전달
- 가상 스크롤 초기 구독/플래시 갱신 안정화
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 프론트 재시작 후 Home/Market/Chart 이동 실시간 확인
2026-01-05 09:37 (local)
Task: SPA 이동 시 마켓/차트 실시간 및 페이징 재시도 보강
Scope: src/components/SymbolTable.tsx, src/hooks/useMarketSymbols.ts, src/hooks/useSymbols.ts, src/hooks/useChart.ts, src/components/ChartContainer.tsx, src/app/chart/[symbol]/SymbolChartClient.tsx, codex_log.md
Why: 버튼 이동 후 페이징/차트 헤더 실시간이 멈추는 현상 완화
Key changes:
- loadMore 실패 시 동일 길이 재시도 허용
- 차트/메트릭에서 market 파라미터 우선 적용
- chart ws close 가드 및 오류 메시지 완화
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 프론트 재시작 후 Market/Chart 이동 실시간/페이징 확인
2026-01-05 12:09 (local)
Task: SPA 이동 후 WS 재연결/페이징 트리거 리셋 및 차트 오류 UI 완화
Scope: src/components/SymbolTable.tsx, src/hooks/useMarketSymbols.ts, src/hooks/useSymbols.ts, src/hooks/useChart.ts, src/components/ChartContainer.tsx, src/app/chart/page.tsx
Why: 버튼 이동 후 실시간/페이징이 멈추는 현상과 차트 오류 플래시를 줄이기 위함
Key changes:
- SymbolTable에서 order 리셋 시 loadMore 트리거 상태 초기화
- WS 훅(useSymbols/useMarketSymbols/useChart)에서 SPA 재진입 시 reconnect 차단 플래그 해제
- 차트 오류 UI를 ws_error는 제외하도록 완화하고 chart 링크에 market 파라미터 포함
Commands run (user):
- (none)
Logs/Artifacts:
- N/A
Next:
- 브라우저에서 SPA 이동/스크롤/차트 실시간 수신 확인
- ws_rt/ws_chart 메시지 샘플 확인
2026-01-06 04:06 (local)
Task: 빈 symbols 상태에서 WS 연결 차단
Scope: src/hooks/useMarketSymbols.ts, src/hooks/useSymbols.ts
Why: symbols= 빈 상태의 WS 접속으로 인한 403/조기 종료를 방지
Key changes:
- symbols 길이가 0이면 connect()를 스킵하도록 가드 추가
- 가시 심볼이 비어지면 WS를 정상 종료
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- Market/Home 진입 시 symbols= 빈 연결이 발생하지 않는지 확인
2026-01-06 09:13 (local)
Task: 차트 헤더 실시간 가격 동기화 및 market별 상태 분리
Scope: src/app/chart/[symbol]/SymbolChartClient.tsx, src/components/ChartContainer.tsx, src/components/SymbolTable.tsx, src/hooks/useMarketSymbols.ts, codex_log.md
Why: 차트 페이지 실시간 지표 지연과 market 전환 시 스크롤/구독 상태 공유 문제를 해소하기 위함
Key changes:
- ChartContainer가 마지막 캔들을 상단 지표로 전달해 현재가를 차트와 동일 타이밍으로 갱신
- SymbolTable 상태/스크롤을 market별로 저장·복원하여 spot/um 전환 간섭 제거
- useMarketSymbols의 구독 키에 market 포함 및 전환 시 이전 구독 정리
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 차트 페이지에서 현재가가 캔들 갱신과 동기화되는지 확인
- Market Overview에서 spot/um 전환 시 스크롤/정렬 상태가 분리되는지 확인
2026-01-07 08:46 (local)
Task: Market Overview spot 심볼 파싱 실패 방지
Scope: src/lib/schemas.ts, codex_log.md
Why: onboard_date null 심볼로 인해 symbols 파싱이 실패해 WS 연결이 생성되지 않음
Key changes:
- SymbolItemSchema에서 onboard_date/onboardDate에 null 허용
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- spot Market Overview 부트스트랩 후 ws_rt 연결이 생성되는지 확인
2026-01-08 03:46 (local)
Task: ws_chart 스냅샷 처리 제거
Scope: src/hooks/useChart.ts
Why: WS 스냅샷이 REST 스냅샷을 덮어쓰는 문제 방지
Key changes:
- ws_chart 메시지에서 SNAPSHOT 처리 제거(델타만 반영)
- 파일 상단 변경 이유 갱신
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 1w 전환 시 REST 스냅샷이 유지되는지 확인
2026-01-08 05:05 (local)
Task: 차트 초기 스냅샷 레이스 완화 + 최신 구간 포커스
Scope: src/hooks/useChart.ts, src/components/ChartContainer.tsx
Why: 초기 진입에서 WS 델타가 REST 스냅샷을 덮거나 첫 캔들 포커스로 보이는 문제 방지
Key changes:
- REST 스냅샷 선적용 및 WS 델타 1건 버퍼링
- 차트 초기 로딩 시 최근 N개 기준 화면 포커스
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- 차트 첫 진입/TF 변경 시 스냅샷 전체 및 최신 구간 포커스 확인
2026-01-08 07:32 (local)
Task: Market Overview 상태 분리 + 로딩 스켈레톤/스크롤 UX 개선
Scope: src/components/SymbolTable.tsx, src/hooks/useMarketSymbols.ts
Why: 시장 전환 시 스크롤/페이징 간섭과 템플릿 점프를 줄이고 WS 재연결을 최소화
Key changes:
- market 전환 시 스크롤/페이징 트리거 분리 및 응답 가드 추가
- 초기 로딩 스켈레톤 유지 + 스크롤 체인 차단 + 로딩 중 표시
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- Market Overview에서 spot/um 전환 후 스크롤/증분 로딩 정상 여부 확인
2026-01-08 08:23 (local)
Task: 차트 번들 캐시 + REST 스냅샷 단일 소스 적용
Scope: src/hooks/useChart.ts, src/lib/chartBundle.ts, src/lib/chartCache.ts, package.json
Why: TF 전환 무로딩과 스냅샷 레이스 제거를 동시에 달성하기 위해
Key changes:
- /api/chart/bundle(msgpack) 기반 번들 fetch/디코딩 유틸 추가
- 메모리 LRU + IndexedDB 캐시 + BroadcastChannel 동기화
- WS 델타는 유지하고 스냅샷은 REST 번들로만 갱신
Commands run (user):
- 없음
Logs/Artifacts:
- 없음
Next:
- npm install 후 차트 진입/TF 전환 캐시 동작 확인
2026-01-08 08:46 (local)
Task: ChartContainer visible range null guard
Scope: src/components/ChartContainer.tsx
Why: setVisibleLogicalRange에 null 전달로 빌드 타입 오류 발생
Key changes:
- keepRange 분기에서 null 체크 후에만 setVisibleLogicalRange 호출
Commands run (user):
- npm run build -> 실패(ChartContainer 타입 에러)
Logs/Artifacts:
- next build: setVisibleLogicalRange type error
Next:
- npm run build 재확인
2026-01-08 09:05 (local)
Task: 프론트 빌드 타입 체크 확인
Scope: (none)
Why: 타입 오류 수정 후 빌드 정상 여부 확인
Key changes:
- (none)
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- next build 성공 로그
Next:
- (none)
2026-01-08 09:05 (local)
Task: chartCache ArrayBuffer 타입 오류 수정
Scope: src/lib/chartCache.ts
Why: Uint8Array.buffer가 SharedArrayBuffer일 수 있어 타입 오류 발생
Key changes:
- bytes를 새 ArrayBuffer로 복사하여 저장
Commands run (user):
- npm run build -> 실패(chartCache ArrayBuffer 타입 에러)
Logs/Artifacts:
- next build: ArrayBuffer | SharedArrayBuffer 타입 불일치
Next:
- npm run build 재확인
2026-01-08 09:01 (local)
Task: SymbolTable observeOffset 타입 import 제거
Scope: src/components/SymbolTable.tsx
Why: ObserveOffsetCallBack 타입 미노출로 build 실패
Key changes:
- observeOffsetNoSync를 observeElementOffset과 동일 시그니처로 정의
Commands run (user):
- npm run build -> 실패(ObserveOffsetCallBack 미존재)
Logs/Artifacts:
- next build: ObserveOffsetCallBack not exported
Next:
- npm run build 재확인
2026-01-08 08:56 (local)
Task: SymbolTable observeOffset 타입 정합성 수정
Scope: src/components/SymbolTable.tsx
Why: observeElementOffset 제네릭 미지정으로 Virtualizer<Element> 타입 충돌 발생
Key changes:
- observeOffsetNoSync에 제네릭 타입 파라미터 적용
- ObserveOffsetCallBack/Virtualizer 타입 명시
Commands run (user):
- npm run build -> 실패(observeElementOffset 타입 에러)
Logs/Artifacts:
- next build: observeElementOffset 타입 불일치
Next:
- npm run build 재확인
2026-01-08 08:52 (local)
Task: SymbolTable price flash null guard
Scope: src/components/SymbolTable.tsx
Why: price가 null인 경우 비교 연산에서 타입 에러 발생
Key changes:
- price/prev price가 모두 null이 아닐 때만 방향 계산
Commands run (user):
- npm run build -> 실패(SymbolTable price null 타입 에러)
Logs/Artifacts:
- next build: row.price possibly null
Next:
- npm run build 재확인
2026-01-08 09:34 (local)
Task: 실시간 값 플래시를 표시 문자열 기준으로 제한
Scope: src/components/SymbolTable.tsx, src/app/chart/[symbol]/SymbolChartClient.tsx, src/app/globals.css
Why: 표시값이 안 바뀐 경우 깜빡임을 방지하고 price 강조 시간을 늘리기 위해
Key changes:
- SymbolTable 플래시를 displayKey 비교로 전환하고 until 연장 방식 적용
- Chart 상단 지표 플래시를 displayKey 기준으로 전환하고 비가격은 중립 깜빡임만 적용
- flash 애니메이션 시간(price 800ms, 기타 300ms) 조정
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- npm run build
2026-01-08 10:11 (local)
Task: Cache Market Overview pages and chart tempByTf in bundle cache
Scope: src/hooks/useMarketSymbols.ts, src/lib/marketCache.ts, src/hooks/useChart.ts, src/lib/chartCache.ts, src/lib/chartBundle.ts, src/components/SymbolTable.tsx
Why: Speed up initial render, avoid market cross-talk, and cache current candle per TF
Key changes:
- Added Market Overview incremental cache with memory+IDB and prefetch pages
- Chart bundle cache stores tempByTf for all TFs and updates on WS deltas
- Sort click resets to desc when changing columns
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Run frontend build/typecheck to confirm no TS errors
- Verify Market Overview cache/prefetch behavior in browser
2026-01-08 10:25 (local)
Task: Fix prefetchPages TDZ error in Market Overview hook
Scope: src/hooks/useMarketSymbols.ts
Why: prefetchPages referenced before initialization caused runtime ReferenceError
Key changes:
- Moved prefetchPages useCallback above loadBootstrap
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Restart frontend dev server to clear stale bundle
2026-01-08 10:41 (local)
Task: Reset Market Overview scroll on market switch
Scope: src/components/SymbolTable.tsx
Why: Prevent spot/um scroll position interference
Key changes:
- Removed per-market scroll state restore
- Force scrollTop reset to 0 on market change
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Verify spot/um switch starts at top and paging works
2026-01-08 10:45 (local)
Task: Hide empty state during Market Overview reloads
Scope: src/components/SymbolTable.tsx
Why: Avoid "표시할 심볼이 없습니다" during sorting/loading
Key changes:
- Removed empty-state block and kept error-only message
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Verify Market Overview no empty message during rapid sort/loading
2026-01-09 15:09 (local)
Task: Switch auth to /app API with email/password + Google OIDC (Day1)
Scope: src/lib/appClient.ts, src/lib/token.ts, src/lib/googleOidc.ts, src/components/auth/RequireAuth.tsx, src/contexts/AuthContext.tsx, src/app/login/page.tsx, src/app/signup/page.tsx, src/app/forgot-password/page.tsx, src/app/reset-password/page.tsx, src/app/verify-email/page.tsx, src/components/Header.tsx, src/app/account/page.tsx, src/app/upgrade/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts, .env.example, .env, .env.local, README.md, package.json, package-lock.json
Why: Remove Supabase and align auth UX to new backend /app contracts with memory-only access tokens
Key changes:
- Added app API client, in-memory token store, Google OIDC helper, and RequireAuth guard
- Rebuilt AuthContext with /app auth/refresh + /app/account/me flow, plus login/signup/2FA handling
- Updated auth pages, i18n strings, env/README, and removed Supabase dependency
Commands run (user):
- npm uninstall @supabase/supabase-js -> 성공
Logs/Artifacts:
- (none)
Next:
- Run npm run build to confirm compilation
- Run npm run lint to confirm lint status
2026-01-09 15:26 (local)
Task: Fix prefetch cursor type in Market Symbols hook
Scope: src/hooks/useMarketSymbols.ts
Why: allow cursor to accept null from merged cursorNext without TS error
Key changes:
- Explicitly typed cursor as number | null during prefetch loop
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Run npm run build to confirm TS error is resolved
- Run npm run lint to ensure no lint regressions
2026-01-09 15:30 (local)
Task: Fix Next prerender error by removing useSearchParams from RequireAuth
Scope: src/components/auth/RequireAuth.tsx
Why: Next.js build fails when useSearchParams triggers CSR bailout without Suspense on /account
Key changes:
- Compute next redirect target from window.location instead of useSearchParams
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Run npm run build again
2026-01-09 15:33 (local)
Task: Remove useSearchParams from auth pages to unblock prerender
Scope: src/app/login/page.tsx, src/app/reset-password/page.tsx, src/app/verify-email/page.tsx
Why: Next.js build fails during prerender when useSearchParams is used without Suspense boundary
Key changes:
- Parse query params via window.location + URLSearchParams inside useEffect (client-only)
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Run npm run build to confirm /login prerender passes
2026-01-09 15:34 (local)
Task: Validate frontend production build
Scope: (none)
Why: Confirm Next.js prerender/typecheck errors are resolved
Key changes:
- (none)
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- (none)
Next:
- npm run lint
2026-01-09 15:45 (local)
Task: Replace invisible white text with ink color
Scope: src/components/Header.tsx, src/app/market/page.tsx, src/app/alerts/page.tsx, src/app/account/page.tsx, src/app/page.tsx, src/app/upgrade/page.tsx, src/app/chart/page.tsx, src/app/login/page.tsx, src/app/payment/page.tsx, src/app/signup/page.tsx, src/app/reset-password/page.tsx, src/app/forgot-password/page.tsx, src/app/verify-email/page.tsx, src/app/chart/[symbol]/SymbolChartClient.tsx, src/styles/globals.css
Why: Ensure white text is visible on light surfaces while keeping contrast distinct from black
Key changes:
- Replaced text-white with text-ink across primary buttons/badges and shared styles
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- (none)
Next:
- Review key screens for contrast consistency
2026-01-10 01:34 (local)
Task: Send CSRF header for /app/auth/refresh
Scope: src/lib/appClient.ts, src/contexts/AuthContext.tsx
Why: Backend refresh requires x-csrf-token header matching csrf cookie
Key changes:
- Added optional csrf header injection from csrf cookie in apiRequest
- Enabled csrf header for AuthContext.refresh
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- (none)
Next:
- Deploy frontend and verify refresh uses rt+csrf cookies
2026-01-10 01:54 (local)
Task: Configure same-origin /app calls via Next rewrites
Scope: next.config.mjs, .env, .env.local, .env.example
Why: Ensure cookies/CSRF work in local HTTP by proxying /app and /api through the frontend origin
Key changes:
- Added API_PROXY_TARGET-based rewrites for /app and /api
- Set NEXT_PUBLIC_API_BASE_URL to / and added API_PROXY_TARGET in env files
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Run npm run build
- Verify /app/auth/refresh sends rt/csrf cookies via localhost origin
2026-01-10 11:09 (local)
Task: Align Google login endpoint with backend
Scope: src/contexts/AuthContext.tsx
Why: Backend Google login endpoint is /app/auth/google, not /app/auth/oidc/google
Key changes:
- Switched Google login API path to /auth/google
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- (none)
Next:
- Verify Google login sets rt/csrf cookies and refresh returns 200
2026-01-10 11:17 (local)
Task: Skip refresh call when no auth cookies
Scope: src/contexts/AuthContext.tsx
Why: Non-logged-in first visit has no rt/csrf cookie, so refresh always 401 and creates noise in browser/server logs
Key changes:
- Detect absence of csrf cookie and mark sessionReady without calling /app/auth/refresh
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- (none)
Next:
- Visit http://localhost:3000 and confirm no /app/auth/refresh request before login
- After login, refresh should run and then GET /app/account/me should succeed
2026-01-10 11:25 (local)
Task: Align password policy messaging with backend
Scope: src/app/signup/page.tsx, src/app/reset-password/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: Backend enforces minimum 12-character password (rejects 8-char with password_too_short), so frontend should validate early and show clear messages
Key changes:
- Added minLength=12 and pre-submit validation (length/whitespace) for signup and reset-password
- Mapped backend error codes (password_too_short/password_has_whitespace) to localized messages
- Updated password placeholders and added i18n keys for password policy
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- (none)
Next:
- Try signup with <12 chars and confirm inline error (no request)
- Try signup with >=12 chars and confirm /app/auth/register succeeds
2026-01-10 11:47 (local)
Task: Fix signup success handling without auto-login
Scope: src/contexts/AuthContext.tsx, src/app/signup/page.tsx, src/app/verify-email/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: /app/auth/register returns only {ok:true} so expecting access_token caused Invalid auth response; need clear success UX
Key changes:
- Signup no longer expects auth payload; success shows message and routes to verify-email
- Verify-email page shows signup success when email query exists
- Added localized messages for signup success and email_exists
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Try signup success -> verify-email shows success banner with email
2026-01-10 11:53 (local)
Task: Fix passive wheel preventDefault warning in SymbolTable
Scope: src/components/SymbolTable.tsx
Why: onWheel uses preventDefault; React wheel listeners may be passive, causing warnings
Key changes:
- Moved wheel boundary preventDefault logic to native wheel listener with { passive: false }
- Removed React onWheel handler on the scroll container
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Scroll Market Overview and confirm no passive event warning in console
2026-01-10 11:58 (local)
Task: Prevent dev-only WebSocket "closed before established" noise
Scope: src/hooks/useSymbols.ts, src/hooks/useChart.ts
Why: In React StrictMode(dev), effects mount/unmount immediately; closing a CONNECTING WebSocket triggers browser warning even though it’s intentional cleanup
Key changes:
- Delay WebSocket creation to next tick and cancel pending creation on cleanup/disable
- Keep existing reconnect/replace logic unchanged
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- (none)
Next:
- Open home and /chart pages in dev and confirm the warning no longer appears
2026-01-10 12:21 (local)
Task: Fix verify-email 422 by requiring token and guide resend flow
Scope: src/app/verify-email/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: Backend /app/auth/email/verify requires token; frontend was sending email-only payload causing 422
Key changes:
- Disable verify action when token is missing; POST /auth/email/verify sends { token } only
- Resend keeps using email; added clearer i18n messages for missing token/email
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- (none)
Next:
- After signup (email-only), verify button should be disabled; resend should work
- Open email link with token -> verify should return 200 and show success
2026-01-10 13:12 (local)
Task: Add production-grade signup validation + verify-email UX states
Scope: src/app/signup/page.tsx, src/app/verify-email/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: Show password errors on blur, block invalid signup submits, and split verify-email into email-only vs token modes with loading/success/failure states
Key changes:
- Signup validation now displays inline errors on blur and disables submit until valid
- Verify-email auto-verifies when token exists; resend only in email mode or failure; added loading/success/CTA copy
- Added i18n keys for password hint and verify states/cooldown
Commands run (user):
- (none)
Logs/Artifacts:
- (none)
Next:
- Blur password/confirm to see inline errors; submit disabled until valid
- Open verify-email with token to see loading -> success -> login CTA
2026-01-11 02:38 (local)
Task: Fix reset-password payload to match backend contract
Scope: src/app/reset-password/page.tsx
Why: Backend /app/auth/password/reset expects new_password; frontend sent password and got 422
Key changes:
- Send { token, new_password } in reset request
Commands run (user):
- date '+%Y-%m-%d %H:%M' -> 성공
Logs/Artifacts:
- (none)
Next:
- Reset password with email link should return 200 without 422
2026-01-11 05:17 (local)
Task: Replace One Tap Google login with official Google button
Scope: src/components/GoogleSignInButton.tsx, src/contexts/AuthContext.tsx, src/app/login/page.tsx, src/app/signup/page.tsx
Why: One Tap prompt UX is limited and emits FedCM migration warnings; use enterprise-standard Sign in with Google button
Key changes:
- Render official Google Sign-In button via google.accounts.id.renderButton and handle credential callback
- Add signInWithGoogleIdToken flow so UI can complete login/signup with returned id_token
Commands run (user):
- date '+%Y-%m-%d %H:%M' -> 성공
Logs/Artifacts:
- (none)
Next:
- Open /login and /signup and confirm Google button renders and completes login
2026-01-11 05:50 (local)
Task: Improve login UX (Google button theme, placeholders, cursor/hover)
Scope: src/components/GoogleSignInButton.tsx, src/app/login/page.tsx, src/app/globals.css
Why: Increase perceived clickability and reduce visual noise in login form
Key changes:
- Use filled blue Google button theme with Continue UX
- Remove placeholders from login inputs
- Add global button cursor pointer + subtle hover translate
Commands run (user):
- date '+%Y-%m-%d %H:%M' -> 성공
Logs/Artifacts:
- (none)
Next:
- Open /login and confirm placeholders are gone and cursor/hover works on all buttons
2026-01-11 05:40 (local)
Task: 인증 에러 번역/잠금 UX + 2FA 보안 설정/탈퇴 UI 추가
Scope: src/lib/appClient.ts, src/lib/auth/authErrors.ts, src/contexts/AuthContext.tsx, src/app/login/page.tsx, src/app/forgot-password/page.tsx, src/app/reset-password/page.tsx, src/app/verify-email/page.tsx, src/app/signup/page.tsx, src/app/account/page.tsx, src/app/account/security/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts, package.json
Why: 백엔드 에러 스키마에 맞춘 사용자 메시지/잠금 안내와 2FA/탈퇴 플로우 완결을 위해.
Key changes:
- authErrors 유틸로 code+meta 기반 메시지 생성 및 로그인 잠금 UI 적용
- 2FA 설정/백업코드/해제 및 계정 탈퇴 UI 추가
- i18n 키 확장 및 에러 표시 일원화
Commands run (user):
- N/A
Logs/Artifacts:
- N/A
Next:
- 프론트에서 로그인/2FA/탈퇴 플로우 점검
- qrcode 패키지 설치 후 보안 설정 화면 렌더 확인
2026-01-13 09:28 (local)
Task: 인증 리다이렉트/이메일 인증/2FA UX/비밀번호 변경 UI 개선
Scope: src/lib/auth/redirect.ts, src/app/login/page.tsx, src/app/verify-email/page.tsx, src/app/account/security/page.tsx, src/lib/auth/authErrors.ts, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: 인증 플로우 리다이렉트 규칙과 email_not_verified 처리, 이메일 인증 UX, 2FA 도움말, 비밀번호 변경 UI를 설계대로 반영.
Key changes:
- next 파라미터 정규화 유틸 추가 및 로그인/이메일 인증 화면에 적용
- 이메일 인증 자동 리다이렉트, email_not_verified CTA, 비밀번호 변경/2FA 도움말 UI 추가
- 다국어 문구 키 확장(ko/en/ja/de)
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- UI 동작 수동 검증(로그인/이메일 인증/2FA/비밀번호 변경)
- 필요 시 리다이렉트 규칙/문구 조정
2026-01-13 11:40 (local)
Task: Google 로그인 MFA 플로우 지원 및 관련 UI 처리 보강
Scope: src/contexts/AuthContext.tsx, src/app/login/page.tsx, src/app/signup/page.tsx
Why: Google 로그인에서도 mfa_required 응답을 처리해 OTP 재전송/안내 흐름을 제공하기 위해.
Key changes:
- Google 로그인 요청에 mfa_code 옵션을 지원하고 mfa_required 결과를 반환
- 로그인 페이지에 Google MFA 단계 분기 및 OTP 재시도 처리 추가
- 회원가입 페이지에서 Google MFA 요구 시 안내 메시지 처리
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- 로그인/회원가입에서 Google MFA 흐름 수동 검증
- MFA 오류(잘못된 코드/만료 토큰) 메시지 확인
2026-01-13 11:45 (local)
Task: 인증/보안 설계 반영 마무리(리프레시 매핑, 2FA 백업 안내, 비번 변경 플레이스홀더)
Scope: src/contexts/AuthContext.tsx, src/app/account/security/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: refresh 매핑을 /account/me 기준으로 고정하고 2FA 백업코드 1회 노출 안내 및 비밀번호 변경 입력 UX를 설계에 맞추기 위해.
Key changes:
- refresh 응답 타입 분리 및 plan 매핑을 /account/me 기준으로 정리
- 2FA 백업코드 1회 노출 안내 문구 추가
- 비밀번호 변경 입력 placeholder를 security 키로 통일
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- MFA/삭제/비번 변경 플로우 수동 검증
- Google MFA 흐름 재점검
2026-01-13 12:03 (local)
Task: security 네임스페이스 등록으로 보안 페이지 번역키 노출 수정
Scope: src/i18n/i18n.ts
Why: i18n ns 목록에 security가 없어 t("security.*")가 키 문자열 그대로 렌더링되는 문제를 해결.
Key changes:
- i18n init ns 배열에 "security" 추가
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- 프론트 재빌드 후 /account/security에서 번역 노출 여부 확인
- 여전히 노출 시 실행 번들/캐시 불일치 점검
2026-01-13 13:25 (local)
Task: 탈퇴 확인 페이지 추가 및 탈퇴 계정 로그인 안내 처리
Scope: src/app/account/security/page.tsx, src/app/account/deleted/page.tsx, src/app/login/page.tsx, src/lib/auth/authErrors.ts, src/i18n/i18n.ts, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: 탈퇴 직후 자동 리다이렉트를 제거하고 사용자가 확인 후 이동하도록 하며, 탈퇴 계정 로그인 시 account_inactive 안내를 표시하기 위해.
Key changes:
- /account/delete 성공 시 /account/deleted 확인 페이지로 이동(자동 로그인 이동 제거)
- /account/deleted에서 signOut 처리 후 로그인/회원가입 버튼 제공
- account_inactive 에러 메시지 매핑 및 로그인 페이지 재가입 CTA 노출
- i18n에 security namespace 등록 및 관련 문구 키 추가
Commands run (user):
- npm run lint -> 실패(SymbolChartClient.tsx Date.now 기존 lint error)
Logs/Artifacts:
- ESLint error: src/app/chart/[symbol]/SymbolChartClient.tsx:189 Date.now() (react-hooks/purity)
Next:
- 프론트에서 탈퇴 후 /account/deleted UX 확인
- 탈퇴 계정 Google 로그인 시 account_inactive 안내/CTA 확인
2026-01-13 14:28 (local)
Task: 탈퇴 계정 로그인 UX 개선(account_inactive meta+다국어 메시지)
Scope: src/lib/auth/authErrors.ts, src/app/login/page.tsx, src/app/signup/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts, ../backend/app/app_api/auth.py, ../backend/docs/CONTRACTS.md
Why: 탈퇴 계정 로그인 시 서버 코드 문자열 노출 없이 재가입 가능까지 남은 기간을 사용자 친화적으로 안내하기 위해.
Key changes:
- 백엔드 account_inactive에 meta.remaining_days 등 추가(탈퇴 유예 기반)
- 프론트 account_inactive를 i18n으로 매핑하고 days가 있으면 "{{days}}일 후" 메시지 표시
- 인증 UI에서 err.message 직접 노출을 제거하고 일반 메시지로 통일
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- 탈퇴 계정으로 /auth/login,/auth/google 시 account_inactive meta 전달 확인
- 로그인 화면에서 재가입 CTA/문구 확인
2026-01-13 14:49 (local)
Task: 탈퇴 계정 재가입 시 account_inactive 안내(남은 일수) 제공
Scope: ../backend/app/app_api/auth.py, ../backend/docs/CONTRACTS.md, src/app/signup/page.tsx
Why: 탈퇴 계정이 회원가입을 시도할 때도 account_inactive meta.remaining_days로 재가입 가능 시점을 안내하고, 프론트에서 서버 문자열 대신 i18n 메시지를 표시하기 위해.
Key changes:
- /app/auth/register에서 비활성(탈퇴) 계정은 403 account_inactive(+meta)로 응답
- signup의 Google 로그인 오류도 parseAuthError/buildAuthMessage로 사용자 친화 메시지 표시
- CONTRACTS.md에 register의 account_inactive 에러 문서화
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- 탈퇴 계정으로 /signup(이메일), Google signup에서 \"{{days}}일 후\" 메시지 확인
2026-01-13 15:20 (local)
Task: 인증 화면 예시 텍스트 제거 및 입력 초기값 미설정(placeholder만 사용)
Scope: src/app/login/page.tsx, src/app/forgot-password/page.tsx, src/app/verify-email/page.tsx, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: 예시 입력값/자동 채움 없이 사용자 입력을 유도하고, 모든 placeholder를 “예시값”이 아닌 안내 문구로 통일하기 위해.
Key changes:
- /forgot-password, /verify-email에서 query email로 input을 자동 채움하지 않도록 제거
- /login에서 email/password/OTP 입력란에 placeholder를 다시 적용(초기값은 항상 빈 값)
- i18n의 email/card/amount/wallet 등 예시 placeholder를 일반 안내 문구로 교체(ko/en/ja/de)
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- /login,/forgot-password,/verify-email에서 query에 email이 있어도 입력이 비어있는지 확인
- 결제/업그레이드 입력란 placeholder가 예시값 없이 안내 문구로 표시되는지 확인
2026-01-13 15:24 (local)
Task: /account/security 입력란 예시 placeholder 제거(인증코드/비밀번호)
Scope: src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: /account/security에서 인증 코드/비밀번호 입력란에 남아있던 예시성 placeholder(숫자/규칙 표기)를 제거하고 안내 문구로 통일하기 위해.
Key changes:
- security.mfaCodePlaceholder/security.newPasswordPlaceholder를 예시 없이 “입력하세요” 형태로 변경
- auth.passwordPlaceholder/auth.otpPlaceholder도 동일 정책으로 예시 없는 placeholder로 통일
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- /account/security에서 인증 코드/비밀번호 placeholder가 예시값 없이 노출되는지 확인
2026-01-13 15:38 (local)
Task: /account/security 입력란 초기값(자동채움) 최소화
Scope: src/app/account/security/page.tsx
Why: 브라우저/비밀번호 매니저가 기본값을 채워 넣는 상황을 줄이고, 모든 input이 빈 값(\"\"\")으로 시작하도록 유도하기 위해.
Key changes:
- 인증 코드 입력란에 name/autoComplete/inputMode 추가
- 비밀번호 입력란에 name/autoComplete=\"new-password\"를 지정해 자동 채움 가능성 완화
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- /account/security 진입 시 입력칸에 값이 자동으로 채워지는지(예: admin) 확인
2026-01-13 16:29 (local)
Task: Google 가입 계정 비밀번호 set 플로우 프론트 반영
Scope: src/app/account/password-set/page.tsx, src/app/account/security/page.tsx, src/contexts/AuthContext.tsx, src/lib/auth/authErrors.ts, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/types/qrcode.d.ts, src/components/GoogleSignInButton.tsx, src/app/chart/[symbol]/SymbolChartClient.tsx
Why: pw_hash=null Google 계정이 탈퇴/2FA disable 등 비밀번호 기반 기능을 사용할 수 있도록, has_password 분기 + Google 재인증 기반 비밀번호 설정 화면을 추가하기 위해
Key changes:
- /account/password-set 페이지 추가(google_id_token 재인증 + new_password 설정 + 2FA 시 mfa_code 입력)
- /account/security에서 has_password=false일 때 비밀번호 설정 CTA로 유도하고, 탈퇴/2FA disable/비밀번호 변경을 set 플로우로 연결
- 로그인 직후 /account/me를 hydrate해 mfa_enabled/has_password 상태를 즉시 반영
- 빌드 실패(Typescript) 방지를 위한 qrcode 타입 선언 및 GoogleSignInButton null 안전 처리
Commands run (user):
- npm run lint -> 성공(경고만)
- npm run build -> 성공
Logs/Artifacts:
- N/A
Next:
- 운영: Google 계정(비밀번호 없음)으로 /account/security → 비밀번호 설정 → 탈퇴/2FA disable 진행 E2E 확인
- 운영: 2FA 켠 계정에서 /account/password-set의 mfa_code(TOTP/백업코드) 검증 확인
2026-01-14 09:15 (local)
Task: Day4 /account/settings UI + 설정 프리페치/적용 추가
Scope: src/app/providers.tsx, src/contexts/AuthContext.tsx, src/app/account/settings/page.tsx, src/app/account/page.tsx, src/i18n/i18n.ts, src/i18n/locales/ko.ts, src/i18n/locales/en.ts, src/i18n/locales/ja.ts, src/i18n/locales/de.ts
Why: 백엔드 /app/account/settings를 기반으로 사용자 환경설정/알림 동의를 조회·저장하고 언어/테마/tz를 런타임에 즉시 반영하기 위해.
Key changes:
- /account/settings 페이지 추가(기본값/알림/야간 금지/주간 다이제스트/마케팅 동의)
- 로그인/세션 복구 후 settings를 프리페치하고 i18n/theme/tz를 즉시 적용
- i18n namespace(accountSettings) 및 번역 추가, /account에서 설정 페이지로 이동 링크 연결
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- /account/settings에서 저장/마케팅 토글 즉시 반영 E2E 확인
- Docker/운영: tzdata 반영 후 tz 검증(Asia/Seoul) 동작 확인
2026-01-15 08:33 (local)
Task: settings 기반 market/chart 기본값 반영 + 마케팅 토글 draft 초기화 버그 수정
Scope: src/store/useSymbolStore.ts, src/contexts/AuthContext.tsx, src/app/account/settings/page.tsx, src/components/SymbolTable.tsx, src/app/market/page.tsx, src/app/chart/[symbol]/SymbolChartClient.tsx, src/lib/appClient.ts
Why: 서버 settings가 market 페이지/차트 초기값에 반영되지 않던 문제와, 마케팅 토글 시 미저장 설정이 초기화되는 UX 버그를 해결하기 위해.
Key changes:
- settings prefs를 zustand store로 하이드레이트하여 market 기본값/정렬/TF/통화를 전역 단일 소스로 적용
- /account/settings는 server state(React Query)와 draft state를 분리해 마케팅 토글(부분 PUT) 시 draft 유지
- 401 invalid_token에 대해 refresh 후 1회 재시도(appClient)로 settings 로딩 안정화
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- next build: /account/settings 라우트 생성 확인
Next:
- /account/settings에서 기본 마켓/정렬/TF 저장 후 /market, /chart/[symbol] 반영 확인
- 마케팅 토글 중 미저장 변경이 유지되는지 확인
2026-01-15 08:46 (local)
Task: market overview→chart 진입 시 metrics window TF 우선 적용
Scope: src/components/SymbolTable.tsx, src/app/chart/[symbol]/SymbolChartClient.tsx
Why: 차트 초기 TF가 진입 컨텍스트에 따라 달라야 함(일반 진입=환경설정 기본 TF, market overview 진입=metrics window 기반).
Key changes:
- market(SymbolTable)에서 차트 링크에 tf 쿼리 파라미터를 추가하고(1M/1Y는 1d/1w로 매핑)
- chart 페이지는 tf 쿼리 파라미터가 있으면 이를 최우선으로 초기 TF에 사용, 없으면 settings 기본 TF 사용
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- next build 성공(라우트 생성 확인)
Next:
- market에서 window 변경 후 심볼 클릭→차트 초기 TF가 window와 일치하는지 확인
- 다른 페이지(/chart, /news 등)에서 차트 진입 시 기본 TF가 settings.tf_default인지 확인

2026-01-15 11:11 (local)
Task: Market Overview metrics null 파싱 허용
Scope: src/lib/schemas.ts
Why: metrics 응답에서 prev_close/change/pct_change가 null일 수 있는데, 배열 전체 Zod 파싱 실패로 4h/1d/1M/1Y 값이 비어 보이는 문제를 해결.
Key changes:
- MetricItemSchema의 주요 숫자 필드에 null 허용 추가로 metrics/tickers/ws items 전체 드랍 방지
Commands run (user):
- <none>
Logs/Artifacts:
- <none>
Next:
- 프론트 재기동 후 /market에서 window=4h/1d/1M/1Y 전환 시 값 표시 확인

2026-01-15 14:31 (local)
Task: market window 새로고침 유지 + 차트 캐시 플리커 제거
Scope: src/store/useSymbolStore.ts, src/components/SymbolTable.tsx, src/app/market/page.tsx, src/hooks/useChart.ts
Why: settings hydrate가 market metrics window를 덮어쓰는 문제와, 차트 캐시 표시 중 WS 델타가 잠깐 붙었다 사라지는 플리커를 제거하기 위해.
Key changes:
- market metrics window는 URL(window)+localStorage로만 복원하고 settings.tf_default로 덮어쓰지 않음
- 차트는 첫 서버 번들 적용 전까지 WS 델타를 버퍼링해 “임시 티커” 노출 제거
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- <none>
Next:
- /market?window=1Y 새로고침 시 window 유지 확인
- /chart 캐시 표시 중 오른쪽 임시 캔들 플리커가 사라졌는지 확인

2026-01-15 18:47 (local)
Task: market 캐시 표시 중 로딩 애니메이션 제거(SWR)
Scope: src/hooks/useMarketSymbols.ts, src/components/SymbolTable.tsx
Why: 새로고침 시 캐시 데이터가 보이는 상태에서 pulse 로딩 애니메이션이 끼는 UX를 제거하고, 최신 데이터는 무중단 스왑으로 갱신하기 위해.
Key changes:
- useMarketSymbols에 isLoading(초기 0건) / isSyncing(백그라운드 동기화) 분리
- SymbolTable은 스켈레톤 행에서만 LoadingBar를 렌더(캐시 표시 중에는 애니메이션 0)
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- <none>
Next:
- /market 새로고침 시 pulse 없이 캐시→최신 무중단 스왑 확인

2026-01-15 18:57 (local)
Task: market 무중단 스왑 중 flash 비활성 + flash 시간 단축
Scope: src/components/SymbolTable.tsx
Why: 캐시→서버 스왑에서 값 flash가 로딩처럼 보이는 현상을 제거하고 체감 플리커를 줄이기 위해.
Key changes:
- isSyncing 동안 flash 계산/표시를 차단하고 기존 flash 상태를 즉시 제거
- flash 시간(PRICE_FLASH_MS/BLINK_MS)을 300ms/180ms로 고정
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- <none>
Next:
- /market에서 F5 시 값 flash가 스왑 구간에 나오지 않는지 확인

2026-01-15 19:14 (local)
Task: market F5 시 캐시→스켈레톤 플리커 제거(초기 window 선결정)
Scope: src/store/useSymbolStore.ts, src/components/SymbolTable.tsx
Why: 첫 렌더 후 URL/localStorage window를 적용하면서 queryKey가 2번 바뀌어 캐시 표시 후 스켈레톤으로 재전환되는 문제를 제거하기 위해.
Key changes:
- store 초기 metricWindow를 URL(window)→localStorage→기본값 순으로 선결정
- URL에 window가 없으면 현재 window를 1회 router.replace로 동기화
Commands run (user):
- npm run build -> 성공
Logs/Artifacts:
- <none>
Next:
- /market?window=1Y에서 F5 시 스켈레톤 재전환이 사라졌는지 확인
