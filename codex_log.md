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
