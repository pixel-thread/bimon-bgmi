import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com";

  const robots = `User-agent: *
Allow: /
Allow: /about
Allow: /how-it-works
Allow: /tournament
Allow: /tournament/winners
Allow: /privacy
Allow: /terms

Disallow: /admin
Disallow: /login
Disallow: /api
Disallow: /_next
Disallow: /tournament/vote

Sitemap: ${baseUrl}/sitemap.xml`;

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}