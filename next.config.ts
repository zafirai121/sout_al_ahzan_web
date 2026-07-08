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
};

export default nextConfig;
