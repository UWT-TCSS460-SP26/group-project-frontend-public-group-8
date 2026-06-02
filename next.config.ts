import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Not required for Vercel, but good practice for local dev
  // to ensure the root is correctly identified.
  turbopack: {
    root: __dirname,
  },

  // Turn off since we're deploying to Vercel, which has its own indicators
  devIndicators: false,

  // We don't need to expose source maps in production
  productionBrowserSourceMaps: false,

  // Proxy API requests to the backend to avoid CORS issues
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
