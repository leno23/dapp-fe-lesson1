import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 在构建时忽略ESLint错误，不会导致构建失败
    ignoreDuringBuilds: true,
  },
  // TypeScript错误仍然会导致构建失败（保持代码质量）
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
};

export default nextConfig;
