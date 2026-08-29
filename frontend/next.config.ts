import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use empty turbopack config since Next.js 16 defaults to Turbopack
  turbopack: {},
  output: "standalone",
  // Webpack fallback for when building with --webpack flag
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
