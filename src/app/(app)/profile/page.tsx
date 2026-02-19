"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Avatar,
    Chip,
    Divider,
    Skeleton,
} from "@heroui/react";
import {
    Target,
    Swords,
    Skull,
    Gamepad2,
    Wallet,
    Flame,
    Trophy,
    Crown,
    Shield,
    User,
    AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface ProfileData {
    id: string;
    username: string;
    email: string;
    imageUrl: string | null;
    role: string;
    player: {
        id: string;
        displayName: string | null;
        category: string;
        hasRoyalPass: boolean;
        isBanned: boolean;
        characterImage: {
            url: string;
            thumbnailUrl: string | null;
            isAnimated: boolean;
            isVideo: boolean;
        } | null;
        stats: {
            kills: number;
            deaths: number;
            matches: number;
            kd: number;
        } | null;
        wallet: {
            balance: number;
        };
        streak: {
            current: number;
            longest: number;
        } | null;
    } | null;
}

/**
 * /profile — User's profile page.
 * Shows character hero, stats grid, wallet balance, and streak info.
 */
export default function ProfilePage() {
    const { data: profile, isLoading, error } = useQuery<ProfileData>({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/profile");
            if (!res.ok) throw new Error("Failed to fetch profile");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-20 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load profile.
                </div>
            </div>
        );
    }

    const player = profile.player;
    const stats = player?.stats;
    const name = player?.displayName || profile.username;

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            <div className="space-y-4">
                {/* Hero card */}
                <Card className="overflow-hidden border border-divider">
                    <div className="relative h-40 w-full">
                        {player?.characterImage?.url ? (
                            <img
                                src={player.characterImage.url}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <User className="h-16 w-16 text-primary/30" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                        {/* Profile info */}
                        <div className="absolute bottom-3 left-4 flex items-end gap-3">
                            <Avatar
                                src={profile.imageUrl || undefined}
                                name={name}
                                className="h-16 w-16 ring-2 ring-background"
                            />
                            <div className="pb-0.5">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-white drop-shadow">
                                        {name}
                                    </h1>
                                    {player?.hasRoyalPass && (
                                        <Crown className="h-4 w-4 text-yellow-400" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-white/60">@{profile.username}</span>
                                    {player && (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            className="bg-white/10 text-white backdrop-blur-sm"
                                        >
                                            {player.category}
                                        </Chip>
                                    )}
                                    {profile.role !== "PLAYER" && (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            startContent={<Shield className="h-3 w-3" />}
                                        >
                                            {profile.role}
                                        </Chip>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* No player yet */}
                {!player && (
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-8 text-center">
                        <User className="h-10 w-10 text-foreground/20" />
                        <p className="text-sm text-foreground/50">
                            You don&apos;t have a player profile yet. Ask an admin to add
                            you!
                        </p>
                    </div>
                )}

                {/* Stats grid */}
                {stats && (
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                label: "K/D Ratio",
                                value: isFinite(stats.kd) ? stats.kd.toFixed(2) : "0.00",
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
                                color: "text-foreground/50",
                            },
                            {
                                label: "Matches",
                                value: stats.matches.toLocaleString(),
                                icon: Gamepad2,
                                color: "text-success",
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="border border-divider">
                                    <CardBody className="p-3">
                                        <div className="flex items-center gap-2">
                                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                            <span className="text-xs text-foreground/50">
                                                {stat.label}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xl font-bold">{stat.value}</p>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Wallet + Streak row */}
                {player && (
                    <div className="grid grid-cols-2 gap-3">
                        {/* Wallet */}
                        <Card className="border border-divider">
                            <CardBody className="p-3">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-warning" />
                                    <span className="text-xs text-foreground/50">Balance</span>
                                </div>
                                <p
                                    className={`mt-1 text-xl font-bold ${player.wallet.balance < 0
                                            ? "text-danger"
                                            : "text-foreground"
                                        }`}
                                >
                                    {player.wallet.balance} UC
                                </p>
                            </CardBody>
                        </Card>

                        {/* Streak */}
                        <Card className="border border-divider">
                            <CardBody className="p-3">
                                <div className="flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs text-foreground/50">Streak</span>
                                </div>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <p className="text-xl font-bold">
                                        {player.streak?.current ?? 0}
                                    </p>
                                    <span className="text-xs text-foreground/40">
                                        best: {player.streak?.longest ?? 0}
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
