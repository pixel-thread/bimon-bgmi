import { GAME, GAME_MODE } from "@/lib/game-config";
import type { MetadataRoute } from "next";

const ICON_DIRS: Record<string, string> = { freefire: "freefire", pes: "pes", mlbb: "mlbb" };
const ICON_DIR = `/icons/${ICON_DIRS[GAME_MODE] ?? "bgmi"}`;

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: GAME.name,
        short_name: GAME.name,
        description: `${GAME.gameName} tournament management platform`,
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        orientation: "portrait",
        categories: ["games", "sports"],
        icons: [
            {
                src: `${ICON_DIR}/icon-192x192.png`,
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: `${ICON_DIR}/icon-512x512.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: `${ICON_DIR}/icon-512x512.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: `${ICON_DIR}/apple-touch-icon.png`,
                sizes: "180x180",
                type: "image/png",
                purpose: "any",
            },
        ],
    };
}
