"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Chip,
    Avatar,
    Input,
    Button,
    Skeleton,
} from "@heroui/react";
import {
    Users,
    Search,
    Crown,
    ShieldBan,
    ChevronsDown,
    AlertCircle,
    Wallet,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

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
    meta: { hasMore: boolean; nextCursor: string | null };
}

const categoryColors: Record<string, "warning" | "primary" | "success" | "secondary" | "danger" | "default"> = {
    S: "warning",
    A: "primary",
    B: "success",
    C: "secondary",
    D: "danger",
    Unranked: "default",
};

/**
 * /dashboard/players — Admin player management.
 * Shows all players with balance, category, ban status.
 */
export default function AdminPlayersPage() {
    const [search, setSearch] = useState("");
    const [tier, setTier] = useState("All");

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery<PlayersResponse>({
            queryKey: ["admin-players", { search, tier }],
            queryFn: async ({ pageParam }) => {
                const params = new URLSearchParams({
                    search,
                    tier,
                    sortBy: "name",
                    sortOrder: "asc",
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Players</h1>
                <p className="text-sm text-foreground/50">
                    Manage player profiles and balances
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    placeholder="Search players..."
                    value={search}
                    onValueChange={setSearch}
                    startContent={<Search className="h-4 w-4 text-default-400" />}
                    classNames={{
                        inputWrapper: "bg-default-100 border-none shadow-none max-w-xs",
                    }}
                    size="sm"
                    isClearable
                    onClear={() => setSearch("")}
                />
                <div className="flex gap-1">
                    {["All", "S", "A", "B", "C", "D"].map((t) => (
                        <Button
                            key={t}
                            size="sm"
                            variant={tier === t ? "solid" : "flat"}
                            color={tier === t ? "primary" : "default"}
                            onPress={() => setTier(t)}
                            className="min-w-0 px-3 text-xs"
                        >
                            {t}
                        </Button>
                    ))}
                </div>
            </div>

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
                                <div className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-default-100">
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
        </div>
    );
}
