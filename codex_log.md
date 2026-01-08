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
