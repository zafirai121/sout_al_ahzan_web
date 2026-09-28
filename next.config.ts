import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    // Resized by Cloudflare Image Transformations (see src/utils/image.ts)
    loader: 'custom',
    loaderFile: './src/lib/cf-image-loader.ts',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['192.168.3.254', 'localhost'],
};

export default nextConfig;
