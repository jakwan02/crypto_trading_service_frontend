# Environment Variables (frontend)

## 핵심 원칙
- 프론트는 **백엔드 루트(base)** 만 알고, `/api`, `/app` prefix는 코드가 붙인다.
- WS는 WebSocket 생성이므로 **`ws://` 또는 `wss://` 형태의 base** 가 필요하다. (`/` 같은 상대경로 금지)

## Required
- `NEXT_PUBLIC_API_BASE_URL`
  - 예: `http://localhost:8001` 또는 `/`(리버스프록시 단일 오리진)
- `NEXT_PUBLIC_WS_BASE_URL`
  - 예: `ws://localhost:8002` 또는 `https://example.com`(코드에서 wss로 변환)

## Optional (토큰 보호 사용 시)
- (없음) 브라우저 번들에 공유 시크릿을 포함하지 않는다(`NEXT_PUBLIC_*` 토큰 미사용)

## Optional (Google OIDC)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Optional (개발용 Mock 결제)
- `NEXT_PUBLIC_ENABLE_DEV_BILLING=1`
  - `NODE_ENV==="production"`에서는 자동으로 비노출(404)
- `API_PROXY_TARGET`
  - Next API route(`/api/dev/billing/checkout`)가 백엔드로 프록시할 때 대상 루트
  - 예: `http://localhost:8001`
- `DEV_BILLING_TOKEN` (**server-only**)
  - Next API route가 백엔드로 `X-Dev-Token`을 주입할 때 사용

## 권장 설정(단일안)
### 로컬 개발(백엔드 직접 포트)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8002
```

### 로컬 개발(백엔드 Caddy 단일 오리진)
```bash
NEXT_PUBLIC_API_BASE_URL=/
NEXT_PUBLIC_WS_BASE_URL=https://localhost
```

관련 백엔드 문서:
- `backend/docs/reverse_proxy_caddy.md`

### 운영(리버스프록시 단일 오리진)
```bash
NEXT_PUBLIC_API_BASE_URL=/
NEXT_PUBLIC_WS_BASE_URL=https://<your-domain>
```

## 주의(재발 방지)
- `NEXT_PUBLIC_WS_BASE_URL=/` 는 금지
  - 프론트 코드에서 `new WebSocket(\`\${wsBase}/ws_...\`)` 형태로 URL을 만들기 때문에, 반드시 `ws(s)://` 또는 `http(s)://` 기반이어야 한다.

## env 파일 분리(로컬 vs 배포)
- 로컬 개발: `.env.local` (백엔드 직접 포트 권장값)
- 배포(도커 빌드): `.env.production`
  - 예시 파일: `.env.production.example` (복사 → `.env.production`)
  - 주의: Next 빌드 시 `.env.local`이 있으면 `.env.production`을 덮어쓸 수 있으므로, 도커 빌드 컨텍스트에서 `.env.local`을 제외한다(`.dockerignore`).
