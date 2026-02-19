"use client";

import { Avatar, Chip, Button } from "@heroui/react";
import {
    Target,
    Gamepad2,
    Skull,
    Loader2,
    ChevronsDown,
    Wallet,
    Crown,
} from "lucide-react";
import type { PlayerDTO, PlayersMeta } from "@/hooks/use-players";
import { useAuthUser } from "@/hooks/use-auth-user";

function getDisplayName(
    displayName: string | null,
    username: string
): string {
    return displayName || username;
}

function getCategoryColor(category: string) {
    const colors: Record<string, "warning" | "primary" | "success" | "secondary" | "danger" | "default"> = {
        S: "warning",
        A: "primary",
        B: "success",
        C: "secondary",
        D: "danger",
        Unranked: "default",
    };
    return colors[category] || "default";
}

interface PlayerTableProps {
    players: PlayerDTO[];
    meta?: PlayersMeta;
    startIndex?: number;
    onPlayerClick: (id: string) => void;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
}

export function PlayerTable({
    players,
    meta,
    startIndex = 0,
    onPlayerClick,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
}: PlayerTableProps) {
    const { isAdmin, isSuperAdmin } = useAuthUser();

    return (
        <div className="space-y-2">
            {/* Table header - desktop only */}
            <div className="hidden items-center gap-3 rounded-lg bg-default-100 px-4 py-2 text-xs font-semibold text-foreground/50 sm:flex">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">Player</span>
                <span className="w-14 text-center">Tier</span>
                <span className="w-16 text-right">K/D</span>
                <span className="w-16 text-right">Kills</span>
                <span className="w-16 text-right">Matches</span>
                {isAdmin && <span className="w-20 text-right">Balance</span>}
            </div>

            {/* Player rows */}
            <div className="space-y-1">
                {players.map((player, i) => {
                    const rank = startIndex + i + 1;
                    const kd = player.stats.kd;
                    const displayKd = isFinite(kd) ? kd.toFixed(2) : "0.00";

                    return (
                        <div
                            key={player.id}
                            onClick={() => onPlayerClick(player.id)}
                            className="group flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-default-100 active:bg-default-200"
                        >
                            {/* Rank */}
                            <span className="w-8 text-center text-xs font-medium text-foreground/40">
                                {rank}
                            </span>

                            {/* Avatar + Name */}
                            <div className="flex flex-1 items-center gap-3 overflow-hidden">
                                <div className="relative shrink-0">
                                    <Avatar
                                        src={player.imageUrl || undefined}
                                        name={getDisplayName(player.displayName, player.username)}
                                        size="sm"
                                        className="h-9 w-9"
                                    />
                                    {player.hasRoyalPass && (
                                        <Crown className="absolute -right-0.5 -top-0.5 h-3 w-3 text-yellow-500" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {getDisplayName(player.displayName, player.username)}
                                    </p>
                                    <p className="truncate text-xs text-foreground/40 sm:hidden">
                                        KD {displayKd} · {player.stats.kills} kills
                                    </p>
                                </div>
                            </div>

                            {/* Tier chip */}
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getCategoryColor(player.category)}
                                className="hidden sm:flex"
                            >
                                {player.category}
                            </Chip>

                            {/* Stats - desktop */}
                            <div className="hidden w-16 text-right sm:block">
                                <span className="text-sm font-semibold">{displayKd}</span>
                            </div>
                            <div className="hidden w-16 text-right sm:block">
                                <span className="text-sm text-foreground/60">
                                    {player.stats.kills}
                                </span>
                            </div>
                            <div className="hidden w-16 text-right sm:block">
                                <span className="text-sm text-foreground/60">
                                    {player.stats.matches}
                                </span>
                            </div>

                            {/* Balance - admin only */}
                            {isAdmin && (
                                <div className="hidden w-20 text-right sm:block">
                                    <span
                                        className={`text-sm font-medium ${player.balance < 0
                                                ? "text-danger"
                                                : player.balance > 0
                                                    ? "text-success"
                                                    : "text-foreground/40"
                                            }`}
                                    >
                                        {player.balance}
                                    </span>
                                </div>
                            )}

                            {/* Mobile tier badge */}
                            <Chip
                                size="sm"
                                variant="dot"
                                color={getCategoryColor(player.category)}
                                className="sm:hidden"
                            >
                                {player.category}
                            </Chip>
                        </div>
                    );
                })}
            </div>

            {/* Load more */}
            {hasNextPage && (
                <div className="flex justify-center pt-2">
                    <Button
                        size="sm"
                        variant="flat"
                        isLoading={isFetchingNextPage}
                        onPress={() => fetchNextPage()}
                        startContent={
                            !isFetchingNextPage && <ChevronsDown className="h-4 w-4" />
                        }
                    >
                        {isFetchingNextPage ? "Loading..." : "Load More"}
                    </Button>
                </div>
            )}

            {/* Super admin balance summary */}
            {isSuperAdmin && meta && (
                <div className="flex items-center justify-center gap-4 pt-2 text-xs">
                    <div className="flex items-center gap-1.5 rounded-lg bg-default-100 px-3 py-1.5">
                        <Wallet className="h-3 w-3 text-default-400" />
                        <span className="text-foreground/50">Total:</span>
                        <span
                            className={`font-semibold ${(meta.totalBalance ?? 0) >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }`}
                        >
                            {(meta.totalBalance ?? 0).toLocaleString()} UC
                        </span>
                    </div>
                    {(meta.negativeBalance ?? 0) < 0 && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-1.5 dark:bg-danger-50/10">
                            <span className="text-foreground/50">Negative:</span>
                            <span className="font-semibold text-danger">
                                {(meta.negativeBalance ?? 0).toLocaleString()} UC
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
