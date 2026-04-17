"use client";

import { motion } from "motion/react";
import { Card, CardBody } from "@heroui/react";
import { GAME } from "@/lib/game-config";
import { useSession } from "next-auth/react";

const SISTER_GAMES = [
    {
        mode: "bgmi",
        name: "PUBGMI",
        fullName: "PUBG Mobile India",
        icon: "/icons/bgmi/icon-192x192.png",
        tagline: "Battle Royale tournaments",
        url: "https://bimon-bgmi.vercel.app",
        gradient: "from-amber-500/20 to-orange-500/20",
        border: "border-amber-500/20",
        textColor: "text-amber-400",
        sharedWallet: false,
    },
    {
        mode: "pes",
        name: "KICKOFF",
        fullName: "eFootball / PES",
        icon: "/icons/pes/icon-192x192.png",
        tagline: "1v1 football tournaments",
        url: "https://bimon-pes.vercel.app",
        gradient: "from-emerald-500/20 to-teal-500/20",
        border: "border-emerald-500/20",
        textColor: "text-emerald-400",
        sharedWallet: false,
    },
    {
        mode: "freefire",
        name: "BOOYAH",
        fullName: "Free Fire",
        icon: "/icons/freefire/icon-192x192.png",
        tagline: "Battle Royale with Booyah",
        url: "https://bimon-boo-yah.vercel.app",
        gradient: "from-violet-500/20 to-purple-500/20",
        border: "border-violet-500/20",
        textColor: "text-violet-400",
        sharedWallet: false,
    },
    {
        mode: "mlbb",
        name: "Mobile Legends",
        fullName: "Mobile Legends: Bang Bang",
        icon: "/icons/mlbb/icon-192x192.png",
        tagline: "5v5 MOBA tournaments",
        url: "https://bimon-ml.vercel.app",
        gradient: "from-blue-500/20 to-cyan-500/20",
        border: "border-blue-500/20",
        textColor: "text-blue-400",
        sharedWallet: false,
    },
];

/**
 * Cross-game promo banner.
 * - Default (wallet mode): shows only other games that share the central wallet.
 * - showAll (community mode): shows all games with "Do you play X?" messaging.
 */
export function CrossGamePromo({ showAll = false }: { showAll?: boolean }) {
    const { data: session } = useSession();
    const userEmail = session?.user?.email;
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
                            We also run tournaments on these games!
                        </p>
                    </div>

                    <div className="grid gap-2">
                        {games.map((g) => (
                            <a
                                key={g.mode}
                                href={userEmail ? `${g.url}/sign-in?login_hint=${encodeURIComponent(userEmail)}` : g.url}
                                className={`flex items-center gap-3 rounded-xl border ${g.border} bg-gradient-to-r ${g.gradient} px-3.5 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]`}
                            >
                                <img src={g.icon} alt={g.name} className="h-11 w-11 rounded-xl object-contain shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold">
                                        {showAll ? (
                                            <>Do you play <span className={g.textColor}>{g.fullName}</span>?</>
                                        ) : (
                                            g.name
                                        )}
                                    </p>
                                    <p className="text-[10px] text-foreground/50">{g.tagline}</p>
                                </div>
                                <span className="text-[10px] font-semibold text-primary shrink-0">
                                    Join →
                                </span>
                            </a>
                        ))}
                    </div>

                    <p className="text-[10px] text-foreground/30 text-center">
                        Same account • Join any tournament • Win prizes
                    </p>
                </CardBody>
            </Card>
        </motion.div>
    );
}
