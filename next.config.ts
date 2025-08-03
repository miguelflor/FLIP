import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use export mode for production builds
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
  }),
  images: {
    unoptimized: true
  }
};

export default nextConfig;
