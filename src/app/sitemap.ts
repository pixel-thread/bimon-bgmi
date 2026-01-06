import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://bimon-bgmi.vercel.app";

    // Static pages
    const staticPages = [
        "",
        "/about",
        "/contact",
        "/faq",
        "/guides",
        "/how-it-works",
        "/privacy",
        "/terms",
        "/blog",
        "/tournament",
        "/vote",
        "/positions",
        "/players",
    ];

    return staticPages.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.8,
    }));
}
