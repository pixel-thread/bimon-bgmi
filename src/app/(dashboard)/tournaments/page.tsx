"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Button,
    Chip,
    Input,
    Skeleton,
} from "@heroui/react";
import {
    Trophy,
    Search,
    Users,
    Gamepad2,
    Vote,
    Medal,
    ChevronsDown,
    AlertCircle,
    Plus,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

interface TournamentDTO {
    id: string;
    name: string;
    description: string | null;
    fee: number | null;
    status: string;
    isWinnerDeclared: boolean;
    season: { id: string; name: string } | null;
    startDate: string;
    createdAt: string;
    teamCount: number;
    matchCount: number;
    winnerCount: number;
    poll: {
        id: string;
        isActive: boolean;
        voteCount: number;
    } | null;
}

interface TournamentsResponse {
    success: boolean;
    data: TournamentDTO[];
    meta: { hasMore: boolean; nextCursor: string | null; count: number };
}

const statusColors: Record<string, "success" | "warning" | "danger" | "default"> = {
    ACTIVE: "success",
    INACTIVE: "warning",
    DELETED: "danger",
};

/**
 * /dashboard/tournaments — Admin tournament management page.
 */
export default function TournamentsPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery<TournamentsResponse>({
            queryKey: ["admin-tournaments", { search, status }],
            queryFn: async ({ pageParam }) => {
                const params = new URLSearchParams({
                    search,
                    status,
                    ...(pageParam ? { cursor: pageParam as string } : {}),
                });
                const res = await fetch(`/api/tournaments?${params}`);
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            },
            initialPageParam: null as string | null,
            getNextPageParam: (last) =>
                last.meta.hasMore ? last.meta.nextCursor : undefined,
            staleTime: 30 * 1000,
        });

    const tournaments = data?.pages.flatMap((p) => p.data) ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Tournaments</h1>
                    <p className="text-sm text-foreground/50">
                        Manage tournament lifecycle
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    placeholder="Search tournaments..."
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
                    {["ALL", "ACTIVE", "INACTIVE", "DELETED"].map((s) => (
                        <Button
                            key={s}
                            size="sm"
                            variant={status === s ? "solid" : "flat"}
                            color={status === s ? "primary" : "default"}
                            onPress={() => setStatus(s)}
                            className="min-w-0 px-3 text-xs"
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load tournaments.
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {/* Tournament list */}
            {!isLoading && (
                <div className="space-y-2">
                    {tournaments.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <Trophy className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">No tournaments found</p>
                        </div>
                    ) : (
                        tournaments.map((t, i) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                            >
                                <Card className="border border-divider">
                                    <CardBody className="flex-row items-center gap-4 p-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="truncate text-sm font-semibold">
                                                    {t.name}
                                                </h3>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={statusColors[t.status] ?? "default"}
                                                >
                                                    {t.status}
                                                </Chip>
                                                {t.isWinnerDeclared && (
                                                    <Medal className="h-3.5 w-3.5 text-warning" />
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-foreground/40">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {t.teamCount} teams
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Gamepad2 className="h-3 w-3" />
                                                    {t.matchCount} matches
                                                </span>
                                                {t.poll && (
                                                    <span className="flex items-center gap-1">
                                                        <Vote className="h-3 w-3" />
                                                        {t.poll.voteCount} votes
                                                        {t.poll.isActive && (
                                                            <span className="text-success">• Live</span>
                                                        )}
                                                    </span>
                                                )}
                                                {t.fee != null && (
                                                    <span className="text-warning">{t.fee} UC</span>
                                                )}
                                                {t.season && (
                                                    <span className="text-foreground/30">
                                                        {t.season.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-xs text-foreground/30">
                                            {new Date(t.startDate).toLocaleDateString()}
                                        </span>
                                    </CardBody>
                                </Card>
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
