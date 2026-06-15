import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@better-auth/kysely-adapter"],
  images: {
    remotePatterns: [new URL("https://profile.line-scdn.net/*")],
  },
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
