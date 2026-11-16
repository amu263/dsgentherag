import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    formats: ["image/webp"],
    imageSizes: [240, 320, 420, 560, 720],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048],
  },
  poweredByHeader: false,
};

export default nextConfig;
