/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // React Compiler 활성화 (babel-plugin-react-compiler 이미 devDependencies에 포함됨)
  reactCompiler: true
};

module.exports = nextConfig;