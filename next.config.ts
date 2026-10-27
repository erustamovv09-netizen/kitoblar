import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  allowedDevOrigins: [
    '10.211.144.98',
    '10.108.254.98',
    'localhost',
    '127.0.0.1',
  ],
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://kitoblar-backend.onrender.com'
        : 'http://127.0.0.1:8000');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
