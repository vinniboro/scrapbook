import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  transpilePackages: ["portfolio-website"],
};

export default nextConfig;
