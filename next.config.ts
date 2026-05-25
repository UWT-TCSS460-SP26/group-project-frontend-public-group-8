import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Restrict page detection to tsx/ts/jsx so pages/index.js doesn't conflict
  // with app/page.tsx at the / route.
  pageExtensions: ['tsx', 'ts', 'jsx'],
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
