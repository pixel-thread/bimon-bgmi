import { Suspense } from "react";
import { Toaster } from "sonner";
import Script from "next/script";
import "./globals.css";
import DesktopNavigation from "../components/DesktopNavigation";
import HamburgerMenu from "../components/HamburgerMenu";
import { InitializeSuperAdmin } from "../components/InitializeSuperAdmin";
import { NetworkStatus } from "../components/NetworkStatus";
import { AppUpdateManager } from "../components/AppUpdateManager";
import InstallPrompt from "@/components/InstallPrompt";
import Footer from "@/components/Footer";
// import { GlobalAuth } from "../components/GlobalAuth";

export const metadata = {
  title: "PUBGMI Tournament Management System",
  description:
    "Professional tournament management platform for PUBG Mobile and BGMI esports competitions. Track teams, manage players, calculate K/D statistics, and run competitive gaming events with comprehensive analytics and real-time scoring.",
  keywords:
    "PUBG Mobile, BGMI, tournament, esports, gaming, competition, leaderboard, statistics, K/D ratio, team management",
  author: "PUBGMI Tournament Platform",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/android-chrome-512x512.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        url: '/apple-touch-icon.png',
      },
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#5bbad5', // You can change this color to match your brand
      },
    ],
  },
  other: {
    "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-2651043074081875",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  themeColor: '#ffffff', // Moved from metadata to viewport
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google-adsense-account" content="ca-pub-2651043074081875" />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-2651043074081875"}`}
          crossOrigin="anonymous"
        ></script>
        {/* Open Graph meta tags for social preview */}
        <meta property="og:title" content="PUBGMI Tournament Management System" />
        <meta property="og:description" content="Professional tournament management platform for PUBG Mobile and BGMI esports competitions. Track teams, manage players, calculate K/D statistics, and run competitive gaming events with comprehensive analytics and real-time scoring." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bgmi-tournament.vercel.app/" />
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PUBGMI Tournament Management System" />
        <meta name="twitter:description" content="Professional tournament management platform for PUBG Mobile and BGMI esports competitions." />
        <meta name="twitter:image" content="/og-image.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <InitializeSuperAdmin />
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PUBGMI
                </h1>
              </div>
              <DesktopNavigation />
            </div>
          </div>
        </header>
        <HamburgerMenu />
        <NetworkStatus />
        <AppUpdateManager
          updateStrategy={{
            immediate: false,
            delay: 2000,
            retryAttempts: 3,
          }}
          debug={process.env.NODE_ENV === "development"}
        />
        {/* <GlobalAuth /> */}
        {/* Toasts remain for general errors/success; notification center removed */}
        <Toaster richColors position="top-right" />
        <Suspense fallback={null}>
          <main className="pt-16 min-h-screen">{children}</main>
        </Suspense>
        <Footer />
        <InstallPrompt />
      </body>
    </html>
  );
}
