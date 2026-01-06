import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Disable in development to avoid caching issues
  disable: process.env.NODE_ENV === "development",
  // Custom service worker with our push notification handlers
  customWorkerSrc: "worker",
  customWorkerDest: "worker",
  // Workbox options for caching
  workboxOptions: {
    // Skip waiting for new service worker
    skipWaiting: true,
    clientsClaim: true,
    // Runtime caching for dynamic content
    runtimeCaching: [
      {
        // Cache static assets (JS, CSS, fonts)
        urlPattern: /^https?:\/\/.*\.(js|css|woff|woff2|ttf|otf|eot)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        // Cache images
        urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|gif|svg|ico|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        // Cache page navigations - show cached version, update in background
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
        },
      },
      {
        // Cache API responses with network-first strategy
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
        },
      },
    ],
  },
  // No fallback - cached pages will be shown instead
});

const nextConfig: NextConfig = {
  generateBuildId: async () => {
    // Use timestamp for unique build ID on each deploy
    return `build-${Date.now()}`;
  },
  // eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // If needed, add CORS headers here here as well
          { key: "Access-Control-Allow-Origin", value: "*" }, // or specify allowed origins here
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
