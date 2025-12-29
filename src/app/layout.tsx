import "./globals.css";
import { Wrapper } from "../components/provider/wrapper";

export const metadata = {
  metadataBase: new URL("https://bgmi-tournament.vercel.app"),
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
        color: "#5bbad5",
      },
    ],
  },
  openGraph: {
    title: "PUBGMI Tournament Management System",
    description:
      "Professional tournament management platform for PUBG Mobile and BGMI esports competitions. Track teams, manage players, calculate K/D statistics, and run competitive gaming events with comprehensive analytics and real-time scoring.",
    images: ["/og-image.png"],
    type: "website",
    url: "https://bgmi-tournament.vercel.app/",
  },
  twitter: {
    card: "summary_large_image",
    title: "PUBGMI Tournament Management System",
    description:
      "Professional tournament management platform for PUBG Mobile and BGMI esports competitions.",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  themeColor: "#ffffff",
};

// Inline script to prevent theme flash - runs before any CSS/JS
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ backgroundColor: "var(--background, #f5f5f5)" }}
    >
      <head>
        {/* Blocking script to prevent theme flash - MUST be first */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Critical inline CSS for theme backgrounds */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root { --background: #f5f5f5; --foreground: #18181b; }
              .dark { --background: #000000; --foreground: #fafafa; }
              html, body { background-color: var(--background); color: var(--foreground); }
            `,
          }}
        />
        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PUBGMI" />
        <meta name="google-adsense-account" content="ca-pub-2651043074081875" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2651043074081875"
          crossOrigin="anonymous"
        />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered:', registration.scope);
                  }).catch(function(error) {
                    console.log('SW registration failed:', error);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground">
        <Wrapper>
          {children}
        </Wrapper>
      </body>
    </html>
  );
}
