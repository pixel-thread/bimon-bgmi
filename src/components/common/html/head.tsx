export const HtmlHead = () => {
  return (
    <head>
      <meta name="google-adsense-account" content="ca-pub-2651043074081875" />
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-2651043074081875"}`}
        crossOrigin="anonymous"
      ></script>
      {/* Open Graph meta tags for social preview */}
      <meta property="og:title" content="PUBGMI Tournament Management System" />
      <meta
        property="og:description"
        content="Professional tournament management platform for PUBG Mobile and BGMI esports competitions. Track teams, manage players, calculate K/D statistics, and run competitive gaming events with comprehensive analytics and real-time scoring."
      />
      <meta property="og:image" content="/og-image.png" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://bgmi-tournament.vercel.app/" />
      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="PUBGMI Tournament Management System"
      />
      <meta
        name="twitter:description"
        content="Professional tournament management platform for PUBG Mobile and BGMI esports competitions."
      />
      <meta name="twitter:image" content="/og-image.png" />
    </head>
  );
};
