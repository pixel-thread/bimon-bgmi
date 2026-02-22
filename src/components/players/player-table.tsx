"use client";

import { Avatar, Chip, Button } from "@heroui/react";
import { CategoryBadge } from "@/components/ui/category-badge";
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
                            className={`group flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${player.hasRoyalPass
                                    ? "bg-yellow-500/5 hover:bg-yellow-500/10 active:bg-yellow-500/15"
                                    : "hover:bg-default-100 active:bg-default-200"
                                }`}
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
                                </div>
                                <div className="min-w-0">
                                    <p className="flex items-center gap-1 truncate text-sm font-medium">
                                        {getDisplayName(player.displayName, player.username)}
                                        {player.hasRoyalPass && (
                                            <Crown className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                                        )}
                                    </p>
                                    <span className="sm:hidden">
                                        <CategoryBadge category={player.category} size="sm" />
                                    </span>
                                </div>
                            </div>

                            {/* Tier chip */}
                            <span className="hidden sm:inline-flex">
                                <CategoryBadge category={player.category} size="sm" />
                            </span>

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

                            {/* Mobile KD badge */}
                            <span className="text-sm font-semibold text-foreground/70 sm:hidden">
                                {displayKd}
                            </span>
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


        </div>
    );
}
