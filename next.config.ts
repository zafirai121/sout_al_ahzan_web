import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ckhtndmrcypkqrpjlzli.supabase.co',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: ['192.168.3.254', 'localhost'],
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/m',
        permanent: false, // Make it false for now in dev
      },
    ];
  },
};

export default nextConfig;
