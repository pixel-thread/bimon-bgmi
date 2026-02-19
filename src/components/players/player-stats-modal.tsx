"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    Avatar,
    Chip,
    Progress,
    Divider,
} from "@heroui/react";
import {
    Target,
    Gamepad2,
    Skull,
    Trophy,
    Swords,
    Crown,
    TrendingUp,
    X,
} from "lucide-react";
import type { PlayerDTO } from "@/hooks/use-players";
import { motion } from "motion/react";

function getDisplayName(
    displayName: string | null,
    username: string
): string {
    return displayName || username;
}

interface PlayerStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    player: PlayerDTO | null;
}

/**
 * Player stats modal with character image hero, stats grid, and category badge.
 */
export function PlayerStatsModal({
    isOpen,
    onClose,
    player,
}: PlayerStatsModalProps) {
    if (!player) return null;

    const { stats, characterImage } = player;
    const kd = isFinite(stats.kd) ? stats.kd.toFixed(2) : "0.00";
    const winRate =
        stats.matches > 0
            ? ((stats.kills / Math.max(stats.matches, 1)) * 10).toFixed(1)
            : "0.0";
    const name = getDisplayName(player.displayName, player.username);

    const statCards = [
        {
            label: "K/D Ratio",
            value: kd,
            icon: Target,
            color: "text-primary",
        },
        {
            label: "Total Kills",
            value: stats.kills.toLocaleString(),
            icon: Swords,
            color: "text-danger",
        },
        {
            label: "Deaths",
            value: stats.deaths.toLocaleString(),
            icon: Skull,
            color: "text-foreground/60",
        },
        {
            label: "Matches",
            value: stats.matches.toLocaleString(),
            icon: Gamepad2,
            color: "text-success",
        },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            scrollBehavior="inside"
            classNames={{
                base: "bg-background border border-divider",
                backdrop: "bg-black/60 backdrop-blur-sm",
            }}
        >
            <ModalContent>
                {/* Hero section */}
                <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
                    {characterImage?.url ? (
                        <img
                            src={characterImage.url}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <span className="text-6xl font-bold text-primary/30">
                                {name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                    {/* Player info overlay */}
                    <div className="absolute bottom-4 left-4 flex items-end gap-3">
                        <Avatar
                            src={player.imageUrl || undefined}
                            name={name}
                            className="h-14 w-14 ring-2 ring-background"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-white drop-shadow">
                                    {name}
                                </h2>
                                {player.hasRoyalPass && (
                                    <Crown className="h-4 w-4 text-yellow-400" />
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    className="bg-white/10 text-white backdrop-blur-sm"
                                >
                                    {player.category} Tier
                                </Chip>
                            </div>
                        </div>
                    </div>
                </div>

                <ModalBody className="space-y-4 px-4 pb-6 pt-4">
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {statCards.map((stat) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="rounded-xl bg-default-100 p-3"
                            >
                                <div className="flex items-center gap-2">
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    <span className="text-xs text-foreground/50">
                                        {stat.label}
                                    </span>
                                </div>
                                <p className="mt-1 text-xl font-bold">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* K/D Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground/50">
                                Kill/Death Performance
                            </span>
                            <span className="font-semibold text-primary">{kd}</span>
                        </div>
                        <Progress
                            value={Math.min(Number(kd) * 20, 100)}
                            color="primary"
                            size="sm"
                            classNames={{
                                track: "bg-default-100",
                            }}
                        />
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
