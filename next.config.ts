import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Disable in development to avoid caching issues
  disable: process.env.NODE_ENV === "development",
  // Custom service worker with our push notification handlers
  customWorkerSrc: "worker",
  customWorkerDest: "worker",
  // Fallback pages for offline
  fallbacks: {
    document: "/offline.html",
  },
  // Workbox options for caching
  workboxOptions: {
    // Update-on-navigation strategy:
    // - New SW installs and takes control immediately (skipWaiting + clientsClaim)
    // - But we DON'T reload immediately
    // - Instead, we reload on the user's next navigation (feels natural)
    skipWaiting: true,
    clientsClaim: true,
    // Runtime caching for dynamic content
    runtimeCaching: [
      {
        // Cache JS files - NetworkFirst to always prefer fresh code
        // Falls back to cache only when offline (3 second timeout)
        urlPattern: /^https?:\/\/.*\.js$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "js-assets",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 2, // 2 hours (reduced from 1 day to prevent stale code)
          },
        },
      },
      {
        // Cache CSS and fonts - CacheFirst is fine for these
        urlPattern: /^https?:\/\/.*\.(css|woff|woff2|ttf|otf|eot)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 100,
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
            maxAgeSeconds: 60 * 60, // 1 hour (reduced from 1 day for fresher content)
          },
        },
      },
      {
        // Never cache API responses - prevents stale data issues after deployments
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler: "NetworkOnly",
      },
    ],
  },
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
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
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
