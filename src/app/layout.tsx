import { Suspense } from "react";
import "./globals.css";
import { HtmlHead } from "@/src/components/common/html/head";
import { ClerkProvider } from "@clerk/nextjs";
import { Wrapper } from "../components/provider/wrapper";

export const metadata = {
  title: "PUBGMI Tournament Management System",
  description:
    "Professional tournament management platform for PUBG Mobile and BGMI esports competitions. Track teams, manage players, calculate K/D statistics, and run competitive gaming events with comprehensive analytics and real-time scoring.",
  keywords:
    "PUBG Mobile, BGMI, tournament, esports, gaming, competition, leaderboard, statistics, K/D ratio, team management",
  author: "PUBGMI Tournament Platform",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/android-chrome-512x512.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        url: "/apple-touch-icon.png",
      },
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#5bbad5", // You can change this color to match your brand
      },
    ],
  },
  other: {
    "google-adsense-account":
      process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-2651043074081875",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  themeColor: "#ffffff", // Moved from metadata to viewport
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <Wrapper>
        <html lang="en" className="dark">
          <HtmlHead />
          <body className="min-h-screen bg-background text-foreground">
            <Suspense fallback={null}>
              <main className="pt-16 min-h-screen">{children}</main>
            </Suspense>
          </body>
        </html>
      </Wrapper>
    </ClerkProvider>
  );
}
