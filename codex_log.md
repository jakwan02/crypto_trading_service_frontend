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
