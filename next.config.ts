import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // React Three Fiber v9 loses its WebGL context when React Strict Mode
  // performs its development-only remount. Re-enable this after upgrading
  // the renderer to a version that fixes the upstream issue.
  reactStrictMode: false,
};

export default nextConfig;
