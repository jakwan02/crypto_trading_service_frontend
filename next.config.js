/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // React Compiler 활성화 (babel-plugin-react-compiler 이미 devDependencies에 포함됨)
  reactCompiler: true
};

const hasSentryToken = Boolean(process.env.SENTRY_AUTH_TOKEN);
const hasSentryDsn = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

if (hasSentryToken || hasSentryDsn) {
  // eslint-disable-next-line global-require
  const { withSentryConfig } = require("@sentry/nextjs");
  module.exports = withSentryConfig(nextConfig, { silent: true });
} else {
  module.exports = nextConfig;
}
