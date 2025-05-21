/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable App Directory
  experimental: {
    appDir: true,
  },
  // Image configuration
  images: {
    domains: ['placeholder.com'],
  },
};
