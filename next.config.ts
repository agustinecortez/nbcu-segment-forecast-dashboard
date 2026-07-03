import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the workspace-root warning caused by a parent-level package-lock.json
  // by explicitly setting the Turbopack root to this project directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
