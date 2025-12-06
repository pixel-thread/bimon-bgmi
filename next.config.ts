import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // If needed, add CORS headers here as well
          { key: "Access-Control-Allow-Origin", value: "*" }, // or specify allowed origins here
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
