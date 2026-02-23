import type { Metadata, Viewport } from "next";
import { Rajdhani } from "next/font/google";
import { Providers } from "@/components/providers";
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
  openGraph: {
    type: "website",
    siteName: "PUBGMI",
    title: {
      default: "PUBGMI — Tournament Manager",
      template: "%s | PUBGMI",
    },
    description:
      "Manage BGMI tournaments, teams, UC economy, and player stats.",
  },
  twitter: {
    card: "summary",
    title: {
      default: "PUBGMI — Tournament Manager",
      template: "%s | PUBGMI",
    },
    description:
      "Manage BGMI tournaments, teams, UC economy, and player stats.",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
