/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only tsx/ts/jsx files are treated as pages/routes.
  // This prevents pages/index.js from conflicting with app/page.tsx at /.
  pageExtensions: ['tsx', 'ts', 'jsx'],
}

module.exports = nextConfig
