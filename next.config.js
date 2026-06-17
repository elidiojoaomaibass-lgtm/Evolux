/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Optional: disable static image optimization for all external URLs (fallback to unoptimized)
    // unoptimized: true, // not needed per-image
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
