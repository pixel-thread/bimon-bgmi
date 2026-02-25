import type { Metadata, Viewport } from "next";
import { Rajdhani } from "next/font/google";
import { Providers } from "@/components/providers";
import { RouteTracker } from "@/components/common/route-tracker";
import "./globals.css";

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  applicationName: "PUBGMI",
  title: {
    default: "PUBGMI — Tournament Manager",
    template: "%s | PUBGMI",
  },
  description:
    "Manage BGMI tournaments, teams, UC economy, and player stats — all in one place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PUBGMI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "PUBGMI",
    title: {
      default: "PUBGMI — Tournament Manager",
      template: "%s | PUBGMI",
    },
    description:
      "Manage BGMI tournaments, teams, UC economy, and player stats.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PUBGMI — Tournament Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "PUBGMI — Tournament Manager",
      template: "%s | PUBGMI",
    },
    description:
      "Manage BGMI tournaments, teams, UC economy, and player stats.",
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
