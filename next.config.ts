import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production deployments
  //   experimental: {
  //     staleTimes: {
  //       dynamic: 0, // No stale time for dynamic content
  //       static: 300, // 5 minutes for static content
  //     },
  //     optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  //     // Fix for App Router development issues
  //     serverComponentsExternalPackages: [],
  //   },
  //   // Ensure proper page routing
  //   trailingSlash: false,
  //   // Disable static optimization for dynamic routes during development
  //   generateBuildId: async () => {
  //     // Generate a unique build ID for each deployment
  //     return new Date().getTime().toString();
  //   },
  //   // Comprehensive cache control headers
  //   async headers() {
  //     return [
  //       // Main pages - short cache with revalidation
  //       {
  //         source: "/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)",
  //         headers: [
  //           {
  //             key: "Cache-Control",
  //             value:
  //               "public, max-age=60, stale-while-revalidate=300, must-revalidate",
  //           },
  //           {
  //             key: "X-Content-Type-Options",
  //             value: "nosniff",
  //           },
  //           {
  //             key: "X-Frame-Options",
  //             value: "DENY",
  //           },
  //         ],
  //       },
  //       // API routes - no cache
  //       {
  //         source: "/api/(.*)",
  //         headers: [
  //           {
  //             key: "Cache-Control",
  //             value: "no-store, no-cache, must-revalidate, proxy-revalidate",
  //           },
  //           {
  //             key: "Pragma",
  //             value: "no-cache",
  //           },
  //           {
  //             key: "Expires",
  //             value: "0",
  //           },
  //         ],
  //       },
  //       // Static assets - long cache
  //       {
  //         source: "/_next/static/(.*)",
  //         headers: [
  //           {
  //             key: "Cache-Control",
  //             value: "public, max-age=31536000, immutable",
  //           },
  //         ],
  //       },
  //       // Service Worker - no cache
  //       {
  //         source: "/sw.js",
  //         headers: [
  //           {
  //             key: "Cache-Control",
  //             value: "no-cache, no-store, must-revalidate",
  //           },
  //           {
  //             key: "Service-Worker-Allowed",
  //             value: "/",
  //           },
  //         ],
  //       },
  //     ];
  //   },
  //   // PWA and performance optimizations
  //   async rewrites() {
  //     return [
  //       // Ensure service worker is served from root
  //       {
  //         source: "/service-worker.js",
  //         destination: "/sw.js",
  //       },
  //     ];
  //   },
  // };
  // // Development-specific fixes
  // if (process.env.NODE_ENV === "development") {
  //   // Disable static generation in development to fix routing issues
  //   nextConfig.staticPageGenerationTimeout = 0;
  //   // Ensure pages are always dynamic in development
  //   nextConfig.experimental = {
  //     ...nextConfig.experimental,
  //     // Disable client-side navigation cache in development
  //     clientRouterFilter: false,
  //   };
};

export default nextConfig;
