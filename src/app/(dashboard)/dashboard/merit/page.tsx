"use client";

import { useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Switch,
    Chip,
    Skeleton,
    Avatar,
} from "@heroui/react";
import {
    Shield,
    Star,
    Users,
    BarChart3,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────────── */

interface MeritPlayer {
    id: string;
    displayName: string | null;
    meritScore: number;
    isSoloRestricted: boolean;
    soloMatchesNeeded: number;
    isBanned: boolean;
    user: { username: string };
    _count: { meritRatingsReceived: number };
}

interface MeritRating {
    id: string;
    rating: number;
    createdAt: string;
    fromPlayer: {
        id: string;
        displayName: string | null;
        user: { username: string };
    };
    toPlayer: {
        id: string;
        displayName: string | null;
        meritScore: number;
        user: { username: string };
    };
    tournamentId: string;
}

interface MeritPageData {
    isEnabled: boolean;
    players: MeritPlayer[];
    totalPlayers: number;
    page: number;
    totalPages: number;
    ratings: MeritRating[];
    stats: {
        totalRatings: number;
        avgRating: number;
    };
}

/* ─── Helpers ───────────────────────────────────────────────── */

const playerName = (p: { displayName: string | null; user: { username: string } }) =>
    p.displayName || p.user.username;

const meritColor = (score: number): "success" | "warning" | "danger" | "default" => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    if (score < 60) return "danger";
    return "default";
};

const ratingStars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

const ratingColor = (n: number) => {
    if (n >= 4) return "text-success";
    if (n >= 3) return "text-foreground/60";
    if (n >= 2) return "text-warning";
    return "text-danger";
};

/* ─── Page ──────────────────────────────────────────────────── */

export default function MeritPage() {
    const queryClient = useQueryClient();
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Infinite query for paginated player list
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<MeritPageData>({
        queryKey: ["dashboard-merit"],
        queryFn: async ({ pageParam }) => {
            const res = await fetch(`/api/dashboard/merit?page=${pageParam}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    });

    // Auto-load next page on scroll
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const toggleMerit = useMutation({
        mutationFn: async (enabled: boolean) => {
            const res = await fetch("/api/dashboard/merit", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled }),
            });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        onSuccess: (_, enabled) => {
            toast.success(
                enabled ? "Merit system enabled" : "Merit system disabled"
            );
            queryClient.invalidateQueries({ queryKey: ["dashboard-merit"] });
        },
        onError: () => {
            toast.error("Failed to update setting");
        },
    });

    // Flatten all pages into single lists
    const firstPage = data?.pages[0];
    const isEnabled = firstPage?.isEnabled ?? false;
    const stats = firstPage?.stats ?? { totalRatings: 0, avgRating: 0 };
    const ratings = firstPage?.ratings ?? [];
    const totalPlayers = firstPage?.totalPlayers ?? 0;

    const allPlayers = data?.pages.flatMap((p) => p.players) ?? [];

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-warning" />
                    <h1 className="text-xl font-bold">Merit System</h1>
                </div>
                <p className="text-sm text-foreground/50">
                    Manage teammate merit ratings and player restrictions
                </p>
            </div>

            {/* Enable/Disable Toggle */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border border-divider">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`rounded-full p-2 ${isEnabled ? "bg-success/15" : "bg-foreground/5"
                                    }`}>
                                    <Shield className={`h-5 w-5 ${isEnabled ? "text-success" : "text-foreground/30"
                                        }`} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Merit Rating System</p>
                                    <p className="text-xs text-foreground/40">
                                        {isEnabled
                                            ? "Players must rate teammates before voting"
                                            : "Merit rating is currently disabled"}
                                    </p>
                                </div>
                            </div>
                            {isLoading ? (
                                <Skeleton className="h-6 w-10 rounded-full" />
                            ) : (
                                <Switch
                                    isSelected={isEnabled}
                                    onValueChange={(val) => toggleMerit.mutate(val)}
                                    isDisabled={toggleMerit.isPending}
                                    size="sm"
                                    color="success"
                                />
                            )}
                        </div>
                    </CardBody>
                </Card>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card className="border border-divider">
                        <CardBody className="flex flex-row items-center gap-2.5 p-3">
                            <div className="rounded-full bg-primary/10 p-1.5">
                                <Users className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                                <p className="text-base font-bold">
                                    {isLoading ? <Skeleton className="h-4 w-8 rounded" /> : totalPlayers}
                                </p>
                                <p className="text-[10px] text-foreground/40">Players</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border border-divider">
                        <CardBody className="flex flex-row items-center gap-2.5 p-3">
                            <div className="rounded-full bg-warning/10 p-1.5">
                                <Star className="h-3.5 w-3.5 text-warning" />
                            </div>
                            <div>
                                <p className="text-base font-bold">
                                    {isLoading ? <Skeleton className="h-4 w-8 rounded" /> : stats.totalRatings}
                                </p>
                                <p className="text-[10px] text-foreground/40">Ratings</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className="border border-divider">
                        <CardBody className="flex flex-row items-center gap-2.5 p-3">
                            <div className="rounded-full bg-success/10 p-1.5">
                                <BarChart3 className="h-3.5 w-3.5 text-success" />
                            </div>
                            <div>
                                <p className="text-base font-bold">
                                    {isLoading ? <Skeleton className="h-4 w-8 rounded" /> : stats.avgRating.toFixed(1)}
                                </p>
                                <p className="text-[10px] text-foreground/40">Avg Rating</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

            {/* All Players — sorted by lowest merit */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border border-divider">
                    <CardHeader className="gap-2 pb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">All Players</h3>
                        <span className="text-[11px] text-foreground/35 ml-1">
                            sorted by lowest merit
                        </span>
                        <Chip size="sm" variant="flat" className="ml-auto text-[10px]">
                            {totalPlayers}
                        </Chip>
                    </CardHeader>
                    <Divider />
                    <CardBody className="p-0">
                        {isLoading ? (
                            <div className="space-y-2 p-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded" />
                                ))}
                            </div>
                        ) : allPlayers.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                <Users className="h-8 w-8 text-foreground/15" />
                                <p className="text-xs text-foreground/40">No players found</p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-divider/50">
                                    {allPlayers.map((player, i) => (
                                        <div
                                            key={player.id}
                                            className="flex items-center gap-3 px-4 py-2.5"
                                        >
                                            <span className="text-[11px] text-foreground/25 w-5 text-right tabular-nums">
                                                {i + 1}
                                            </span>
                                            <Avatar
                                                name={playerName(player)}
                                                size="sm"
                                                className="h-7 w-7 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-[13px] font-medium truncate">
                                                        {playerName(player)}
                                                    </p>
                                                    {player.isBanned && (
                                                        <Chip size="sm" variant="flat" color="danger" className="h-4 text-[8px]">
                                                            Banned
                                                        </Chip>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-foreground/35">
                                                    <span>{player._count.meritRatingsReceived} ratings received</span>
                                                    {player.isSoloRestricted && (
                                                        <span className="flex items-center gap-0.5 text-danger">
                                                            <AlertTriangle className="h-2.5 w-2.5" />
                                                            Solo ({player.soloMatchesNeeded} left)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={meritColor(player.meritScore)}
                                                className="text-[11px] font-semibold min-w-[40px] text-center"
                                            >
                                                {player.meritScore}
                                            </Chip>
                                        </div>
                                    ))}
                                </div>

                                {/* Infinite scroll trigger */}
                                <div ref={loadMoreRef} className="flex justify-center py-3">
                                    {isFetchingNextPage && (
                                        <Loader2 className="h-4 w-4 animate-spin text-foreground/30" />
                                    )}
                                    {!hasNextPage && allPlayers.length > 0 && (
                                        <p className="text-[10px] text-foreground/25">
                                            All {totalPlayers} players loaded
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>
            </motion.div>

            {/* Recent Ratings */}
            {ratings.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Card className="border border-divider">
                        <CardHeader className="gap-2 pb-2">
                            <Star className="h-4 w-4 text-warning" />
                            <h3 className="text-sm font-semibold">Recent Ratings</h3>
                        </CardHeader>
                        <Divider />
                        <CardBody className="p-0">
                            <div className="divide-y divide-divider/50">
                                {ratings.map((rating) => (
                                    <div
                                        key={rating.id}
                                        className="flex items-center gap-3 px-4 py-2.5"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px]">
                                                <span className="font-medium">
                                                    {playerName(rating.fromPlayer)}
                                                </span>
                                                <span className="text-foreground/40"> → </span>
                                                <span className="font-medium">
                                                    {playerName(rating.toPlayer)}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-foreground/35">
                                                {new Date(rating.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-mono font-medium ${ratingColor(rating.rating)}`}>
                                            {ratingStars(rating.rating)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
