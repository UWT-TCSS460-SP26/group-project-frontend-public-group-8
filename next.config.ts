import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  devIndicators: false,
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
    minimumCacheTTL: 3600,
  },

  // Proxy API requests to the backend for local dev convenience.
  // NOTE: Next.js App Router route handlers (e.g. /api/auth/*) take strict
  // precedence over rewrites, so NextAuth callbacks are NOT affected.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://tcss-460-group-7.onrender.com/:path*",
      },
    ]
  },
}

export default nextConfig
