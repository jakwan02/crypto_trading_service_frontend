import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // React Compiler 활성화 (babel-plugin-react-compiler 이미 devDependencies에 포함됨)
  reactCompiler: true
};

const hasSentryToken = Boolean(process.env.SENTRY_AUTH_TOKEN);
const hasSentryDsn = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

const config = hasSentryToken || hasSentryDsn ? withSentryConfig(nextConfig, { silent: true }) : nextConfig;

export default config;
