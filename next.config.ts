import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  allowedDevOrigins: [
    "http://localhost:3000", // your Next.js app origin
    "https://uat-bimon-bgmi.vercel.app", // your API origin
  ],
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
