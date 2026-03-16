"use client";

import { motion } from "motion/react";
import { Card, CardBody } from "@heroui/react";
import { GAME } from "@/lib/game-config";

const SISTER_GAMES = [
    {
        mode: "bgmi",
        name: "PUBGMI",
        icon: "/icons/bgmi/icon-192x192.png",
        tagline: "Battle Royale tournaments",
        url: "https://bimon-bgmi.vercel.app",
        gradient: "from-amber-500/20 to-orange-500/20",
        border: "border-amber-500/20",
        sharedWallet: false,
    },
    {
        mode: "pes",
        name: "KICKOFF",
        icon: "/icons/pes/icon-192x192.png",
        tagline: "1v1 football tournaments",
        url: "https://bimon-pes.vercel.app",
        gradient: "from-emerald-500/20 to-teal-500/20",
        border: "border-emerald-500/20",
        sharedWallet: false,
    },
    {
        mode: "freefire",
        name: "BOOYAH",
        icon: "/icons/freefire/icon-192x192.png",
        tagline: "Battle Royale with Booyah",
        url: "https://bimon-boo-yah.vercel.app",
        gradient: "from-violet-500/20 to-purple-500/20",
        border: "border-violet-500/20",
        sharedWallet: false,
    },
];

/**
 * Cross-game promo banner.
 * - Default: shows only other games that share the central wallet (wallet page).
 * - showAll: shows all three games regardless of current domain (community page).
 */
export function CrossGamePromo({ showAll = false }: { showAll?: boolean }) {
    const games = showAll
        ? SISTER_GAMES.filter((g) => g.mode !== GAME.mode)
        : SISTER_GAMES.filter((g) => g.mode !== GAME.mode && g.sharedWallet);
    if (games.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
        >
            <Card className="border border-divider overflow-hidden">
                <CardBody className="gap-3 p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🎮</span>
                        <p className="text-xs font-semibold text-foreground/70">
                            Your {GAME.currencyPlural} work on these games too!
                        </p>
                    </div>

                    <div className="grid gap-2">
                        {games.map((g) => (
                            <a
                                key={g.mode}
                                href={g.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 rounded-xl border ${g.border} bg-gradient-to-r ${g.gradient} px-3.5 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]`}
                            >
                                <img src={g.icon} alt={g.name} className="h-8 w-8 rounded-lg object-contain shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold">{g.name}</p>
                                    <p className="text-[10px] text-foreground/50">{g.tagline}</p>
                                </div>
                                <span className="text-[10px] font-semibold text-primary shrink-0">
                                    Play →
                                </span>
                            </a>
                        ))}
                    </div>

                    <p className="text-[10px] text-foreground/30 text-center">
                        Same account • Same {GAME.currencyPlural} • Different games
                    </p>
                </CardBody>
            </Card>
        </motion.div>
    );
}
