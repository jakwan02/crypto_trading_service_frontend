import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // React Compiler 활성화 (babel-plugin-react-compiler 이미 devDependencies에 포함됨)
  reactCompiler: true,
  async rewrites() {
    /* # 변경 이유: 로컬에서 /app, /api를 same-origin으로 호출하도록 프록시 라우팅 */
    const target = String(process.env.API_PROXY_TARGET || "").trim().replace(/\/+$/, "");
    if (!target) return [];
    return [
      { source: "/app/:path*", destination: `${target}/app/:path*` },
      { source: "/api/:path*", destination: `${target}/api/:path*` }
    ];
  }
};

const hasSentryToken = Boolean(process.env.SENTRY_AUTH_TOKEN);
const hasSentryDsn = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

const config = hasSentryToken || hasSentryDsn ? withSentryConfig(nextConfig, { silent: true }) : nextConfig;

export default config;
