"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
    Chip,
    Avatar,
    Button,
    Skeleton,
} from "@heroui/react";
import {
    Wallet,
    Users,
    Crown,
    ChevronsDown,
    AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { PlayerDetailModal } from "@/components/dashboard/player-detail-modal";
import { usePlayerFilters } from "@/hooks/use-player-filters";
import { PlayerFiltersBar } from "@/components/players/player-filters-bar";

interface PlayerDTO {
    id: string;
    displayName: string | null;
    username: string;
    imageUrl: string | null;
    category: string;
    isBanned: boolean;
    stats: { kills: number; deaths: number; matches: number; kd: number };
    balance: number;
    hasRoyalPass: boolean;
}

interface PlayersResponse {
    data: PlayerDTO[];
    meta: { hasMore: boolean; nextCursor: string | null; totalBalance?: number; negativeBalance?: number };
}

const categoryColors: Record<string, "warning" | "primary" | "success" | "secondary" | "danger" | "default"> = {
    LEGEND: "warning",
    ULTRA_PRO: "primary",
    PRO: "success",
    NOOB: "default",
    ULTRA_NOOB: "secondary",
    BOT: "danger",
};

/**
 * /dashboard/players — Admin player management.
 * Shows all players with balance, category, ban status.
 */
export default function AdminPlayersPage() {
    const filters = usePlayerFilters();
    const { search, tier, sortBy, sortOrder, season } = filters;
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery<PlayersResponse>({
            queryKey: ["admin-players", { search, tier, sortBy, sortOrder, season }],
            queryFn: async ({ pageParam }) => {
                const params = new URLSearchParams({
                    search,
                    tier,
                    sortBy,
                    sortOrder,
                    ...(season ? { season } : {}),
                    limit: "30",
                    ...(pageParam ? { cursor: pageParam as string } : {}),
                });
                const res = await fetch(`/api/players?${params}`);
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            },
            initialPageParam: null as string | null,
            getNextPageParam: (last) =>
                last.meta.hasMore ? last.meta.nextCursor : undefined,
            staleTime: 30 * 1000,
        });

    const players = data?.pages.flatMap((p) => p.data) ?? [];
    const meta = data?.pages[0]?.meta;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Players</h1>
                <p className="text-sm text-foreground/50">
                    Manage player profiles and balances
                </p>
            </div>

            {/* Search + Filters */}
            <PlayerFiltersBar {...filters} />

            {/* UC Balance Summary */}
            {meta && meta.totalBalance != null && (
                <div className="flex items-center gap-4 text-xs">
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

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load players.
                </div>
            )}

            {isLoading && (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {!isLoading && (
                <div className="space-y-1">
                    {/* Table header */}
                    <div className="hidden items-center gap-3 rounded-lg bg-default-100 px-4 py-2 text-xs font-semibold text-foreground/50 sm:flex">
                        <span className="flex-1">Player</span>
                        <span className="w-16 text-center">Tier</span>
                        <span className="w-16 text-right">K/D</span>
                        <span className="w-16 text-right">Matches</span>
                        <span className="w-20 text-right">Balance</span>
                        <span className="w-16 text-center">Status</span>
                    </div>

                    {players.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <Users className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">No players found</p>
                        </div>
                    ) : (
                        players.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.01 }}
                            >
                                <div
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-default-100"
                                    onClick={() => setSelectedPlayerId(p.id)}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <Avatar
                                            src={p.imageUrl || undefined}
                                            name={p.displayName || p.username}
                                            size="sm"
                                            className="h-9 w-9"
                                        />
                                        {p.hasRoyalPass && (
                                            <Crown className="absolute -right-0.5 -top-0.5 h-3 w-3 text-yellow-500" />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {p.displayName || p.username}
                                        </p>
                                        <p className="truncate text-xs text-foreground/40 sm:hidden">
                                            {p.category} · {p.balance} UC
                                        </p>
                                    </div>

                                    {/* Tier */}
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={categoryColors[p.category] ?? "default"}
                                        className="hidden sm:flex"
                                    >
                                        {p.category}
                                    </Chip>

                                    {/* Stats */}
                                    <span className="hidden w-16 text-right text-sm font-semibold sm:block">
                                        {isFinite(p.stats.kd) ? p.stats.kd.toFixed(2) : "0.00"}
                                    </span>
                                    <span className="hidden w-16 text-right text-sm text-foreground/60 sm:block">
                                        {p.stats.matches}
                                    </span>

                                    {/* Balance */}
                                    <span
                                        className={`hidden w-20 text-right text-sm font-medium sm:block ${p.balance < 0
                                            ? "text-danger"
                                            : p.balance > 0
                                                ? "text-success"
                                                : "text-foreground/40"
                                            }`}
                                    >
                                        {p.balance} UC
                                    </span>

                                    {/* Status */}
                                    <div className="hidden w-16 sm:flex justify-center">
                                        {p.isBanned ? (
                                            <Chip size="sm" variant="flat" color="danger">
                                                Banned
                                            </Chip>
                                        ) : (
                                            <Chip size="sm" variant="flat" color="success">
                                                Active
                                            </Chip>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}

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
                                Load More
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Player detail modal */}
            <PlayerDetailModal
                playerId={selectedPlayerId}
                isOpen={!!selectedPlayerId}
                onClose={() => setSelectedPlayerId(null)}
            />
        </div>
    );
}
