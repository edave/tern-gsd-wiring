import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in a parent directory doesn't
  // get picked as the Turbopack root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
