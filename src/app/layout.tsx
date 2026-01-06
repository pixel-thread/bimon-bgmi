import "./globals.css";
import { Wrapper } from "../components/provider/wrapper";

export const metadata = {
  metadataBase: new URL("https://bimon-bgmi.vercel.app"),
  title: "PUBGMI BIMON - BGMI Tournament Platform",
  description:
    "Join competitive BGMI tournaments, track your stats, and compete with the best players!",
  keywords:
    "PUBG Mobile, BGMI, tournament, esports, gaming, competition, leaderboard, statistics, K/D ratio, team management",
  author: "PUBGMI BIMON",
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
    title: "PUBGMI BIMON",
    description:
      "Join competitive BGMI tournaments, track your stats, and compete with the best!",
    images: ["/og-image.png"],
    type: "website",
    url: "https://bimon-bgmi.vercel.app/",
    siteName: "PUBGMI BIMON",
  },
  twitter: {
    card: "summary_large_image",
    title: "PUBGMI BIMON",
    description:
      "Join competitive BGMI tournaments and compete with the best!",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Inline script to prevent theme flash - runs before any CSS/JS
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    
    // Update theme-color meta tag for phone status bar
    var themeColor = isDark ? '#000000' : '#f5f5f5';
    var metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    } else {
      var meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = themeColor;
      document.head.appendChild(meta);
    }
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
        {/* AdSense script loaded conditionally via AdSenseScript component */}
        {/* PWA Install Prompt Capture - SW registration handled by next-pwa */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Capture PWA install prompt IMMEDIATELY to prevent Chrome's mini-infobar
              window.deferredPWAPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.deferredPWAPrompt = e;
                console.log('PWA install prompt captured');
              });
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
