import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // React Compiler 활성화 (babel-plugin-react-compiler 이미 devDependencies에 포함됨)
  reactCompiler: true,
  // 변경 이유: Week6 배포 준비(Next standalone)로 컨테이너 런타임/이미지를 단순화한다.
  output: "standalone",
  async rewrites() {
    /* # 변경 이유: 로컬에서 /app, /api를 same-origin으로 호출하도록 프록시 라우팅 */
    const target = String(process.env.API_PROXY_TARGET || "").trim().replace(/\/+$/, "");
    if (!target) return [];
    return [
      { source: "/app/:path*", destination: `${target}/app/:path*` },
      { source: "/api/:path*", destination: `${target}/api/:path*` }
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" }
        ]
      }
    ];
  }
};

const hasSentryToken = Boolean(process.env.SENTRY_AUTH_TOKEN);
const hasSentryDsn = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

const config = hasSentryToken || hasSentryDsn ? withSentryConfig(nextConfig, { silent: true }) : nextConfig;

export default config;
