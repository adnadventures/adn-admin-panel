import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.app.github.dev", // any Codespaces forwarded URL
      ],
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
