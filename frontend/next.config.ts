import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-ready by default; no custom config required for deployment.
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.56.1"],
};

export default nextConfig;
