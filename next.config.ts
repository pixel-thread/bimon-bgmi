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
        // Cache JS files with StaleWhileRevalidate - serve cached instantly,
        // update in background. This is critical for offline: JS loads from
        // cache immediately even after app kill + no internet
        urlPattern: /^https?:\/\/.*\.js$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "js-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
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
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        // PAGE NAVIGATIONS - StaleWhileRevalidate is the key to real PWA feel:
        // - Serves cached page INSTANTLY (even offline, even after app kill)
        // - Updates cache in background when online
        // - Falls back to offline.html only if page was NEVER visited before
        urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "pages",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days - survive app kills
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
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
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
