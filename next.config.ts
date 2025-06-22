import type { NextConfig } from "next"

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const nextConfig: NextConfig = withBundleAnalyzer({
  output: process.env.TAURI_PLATFORM ? 'export' : 'standalone',
  trailingSlash: process.env.TAURI_PLATFORM ? true : false,
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  eslint: {
    // @todo: remove before going live
    ignoreDuringBuilds: true,
  },
})

export default nextConfig
