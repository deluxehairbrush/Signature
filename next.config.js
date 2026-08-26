/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Vercel multi-service rewrite (required for the Django backend to
  // live in the same repo) swallows Next's internal /_next/image route,
  // so the built-in optimizer 404s in production. The logo is a small
  // static PNG anyway — skip optimization and serve it directly.
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig