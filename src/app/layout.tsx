import type { Metadata, Viewport } from "next";
import { Rajdhani } from "next/font/google";
import { Providers } from "@/components/providers";
import { RouteTracker } from "@/components/common/route-tracker";
import { AutoUpdater } from "@/components/common/auto-updater";

import { GAME, GAME_MODE } from "@/lib/game-config";

import "./globals.css";

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rajdhani",
});

const ICON_DIRS: Record<string, string> = { freefire: "freefire", pes: "pes" };
const ICON_DIR = `/icons/${ICON_DIRS[GAME_MODE] ?? "bgmi"}`;

export const metadata: Metadata = {
  applicationName: GAME.name,
  title: {
    default: `${GAME.name} — Tournament Manager`,
    template: `%s | ${GAME.name}`,
  },
  description:
    `Manage ${GAME.gameName} tournaments, teams, ${GAME.currency} economy, and player stats — all in one place.`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: GAME.name,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: `${ICON_DIR}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
      { url: `${ICON_DIR}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: `${ICON_DIR}/apple-touch-icon.png`,
  },
  openGraph: {
    type: "website",
    siteName: GAME.name,
    title: {
      default: `${GAME.name} — Tournament Manager`,
      template: `%s | ${GAME.name}`,
    },
    description:
      `Manage ${GAME.gameName} tournaments, teams, ${GAME.currency} economy, and player stats.`,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${GAME.name} — Tournament Manager`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: `${GAME.name} — Tournament Manager`,
      template: `%s | ${GAME.name}`,
    },
    description:
      `Manage ${GAME.gameName} tournaments, teams, ${GAME.currency} economy, and player stats.`,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${rajdhani.variable} font-sans antialiased`}>
        <Providers>
          <RouteTracker />
          <AutoUpdater />

          {children}
        </Providers>
      </body>
    </html>
  );
}
