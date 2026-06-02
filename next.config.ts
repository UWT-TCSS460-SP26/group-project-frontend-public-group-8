import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  devIndicators: false,
  productionBrowserSourceMaps: false,
}

export default nextConfig
