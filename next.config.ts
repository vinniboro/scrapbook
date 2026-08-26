import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  transpilePackages: ["portfolio-website"],
  turbopack: {
    // file:../portfolio-website lives outside this git root
    root: path.join(root, ".."),
  },
};

export default nextConfig;
