"use client";

import { useState, useEffect, useRef } from "react";
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
    Slider,
    Input,
    Button,
} from "@heroui/react";
import {
    Shield,
    Star,
    Users,
    BarChart3,
    AlertTriangle,
    Loader2,
    Settings2,
    Ban,
    Save,
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
    banReason: string | null;
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

interface Thresholds {
    banThreshold: number;
    restrictThreshold: number;
    restrictMatches: number;
    minRatings: number;
}

interface MeritPageData {
    isEnabled: boolean;
    thresholds: Thresholds;
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

const meritColor = (score: number, thresholds?: Thresholds): "success" | "warning" | "danger" | "default" => {
    if (thresholds) {
        if (score <= thresholds.banThreshold) return "danger";
        if (score <= thresholds.restrictThreshold) return "warning";
    } else {
        if (score < 60) return "danger";
        if (score < 80) return "warning";
    }
    return "success";
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

    // Local state for threshold editing
    const [editThresholds, setEditThresholds] = useState<Thresholds | null>(null);
    const [showSettings, setShowSettings] = useState(false);

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
                enabled ? "Merit auto-actions enabled" : "Merit auto-actions disabled"
            );
            queryClient.invalidateQueries({ queryKey: ["dashboard-merit"] });
        },
        onError: () => {
            toast.error("Failed to update setting");
        },
    });

    const saveThresholds = useMutation({
        mutationFn: async (thresholds: Thresholds) => {
            const res = await fetch("/api/dashboard/merit", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ thresholds }),
            });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Thresholds updated");
            queryClient.invalidateQueries({ queryKey: ["dashboard-merit"] });
            setShowSettings(false);
        },
        onError: () => {
            toast.error("Failed to save thresholds");
        },
    });

    // Flatten all pages into single lists
    const firstPage = data?.pages[0];
    const isEnabled = firstPage?.isEnabled ?? false;
    const thresholds = firstPage?.thresholds ?? { banThreshold: 30, restrictThreshold: 50, restrictMatches: 3, minRatings: 3 };
    const stats = firstPage?.stats ?? { totalRatings: 0, avgRating: 0 };
    const ratings = firstPage?.ratings ?? [];
    const totalPlayers = firstPage?.totalPlayers ?? 0;

    const allPlayers = data?.pages.flatMap((p) => p.players) ?? [];

    // Initialize edit thresholds from API data
    useEffect(() => {
        if (firstPage?.thresholds && !editThresholds) {
            setEditThresholds(firstPage.thresholds);
        }
    }, [firstPage?.thresholds, editThresholds]);

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
                                    <p className="text-sm font-semibold">Merit Auto-Actions</p>
                                    <p className="text-xs text-foreground/40">
                                        {isEnabled
                                            ? "Low merit scores trigger auto-ban/restrict"
                                            : "Auto-actions from low merit are disabled"}
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

            {/* Threshold Settings */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="border border-divider">
                    <CardHeader
                        className="gap-2 pb-2 cursor-pointer"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Settings2 className="h-4 w-4 text-foreground/50" />
                        <h3 className="text-sm font-semibold">Auto-Action Thresholds</h3>
                        <Chip size="sm" variant="flat" color="warning" className="ml-auto text-[10px]">
                            Ban ≤{thresholds.banThreshold}% · Restrict ≤{thresholds.restrictThreshold}%
                        </Chip>
                    </CardHeader>
                    {showSettings && editThresholds && (
                        <>
                            <Divider />
                            <CardBody className="space-y-5 p-4">
                                {/* Ban Threshold */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <Ban className="h-3.5 w-3.5 text-danger" />
                                            <span className="text-xs font-medium">Auto-Ban Threshold</span>
                                        </div>
                                        <Chip size="sm" variant="flat" color="danger" className="text-[10px]">
                                            ≤{editThresholds.banThreshold}%
                                        </Chip>
                                    </div>
                                    <p className="text-[10px] text-foreground/40 mb-2">
                                        Players with merit score at or below this will be auto-banned
                                    </p>
                                    <Slider
                                        aria-label="Ban threshold"
                                        minValue={0}
                                        maxValue={100}
                                        step={5}
                                        value={editThresholds.banThreshold}
                                        onChange={(v) => setEditThresholds({ ...editThresholds, banThreshold: v as number })}
                                        color="danger"
                                        size="sm"
                                        className="max-w-full"
                                    />
                                </div>

                                {/* Restrict Threshold */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                            <span className="text-xs font-medium">Auto-Restrict Threshold</span>
                                        </div>
                                        <Chip size="sm" variant="flat" color="warning" className="text-[10px]">
                                            ≤{editThresholds.restrictThreshold}%
                                        </Chip>
                                    </div>
                                    <p className="text-[10px] text-foreground/40 mb-2">
                                        Players below this get solo-restricted (must play {editThresholds.restrictMatches} solo matches)
                                    </p>
                                    <Slider
                                        aria-label="Restrict threshold"
                                        minValue={0}
                                        maxValue={100}
                                        step={5}
                                        value={editThresholds.restrictThreshold}
                                        onChange={(v) => setEditThresholds({ ...editThresholds, restrictThreshold: v as number })}
                                        color="warning"
                                        size="sm"
                                        className="max-w-full"
                                    />
                                </div>

                                {/* Restrict Matches & Min Ratings */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Restrict Matches"
                                        description="Solo matches needed"
                                        type="number"
                                        size="sm"
                                        min={1}
                                        max={10}
                                        value={String(editThresholds.restrictMatches)}
                                        onValueChange={(v) => setEditThresholds({ ...editThresholds, restrictMatches: parseInt(v) || 3 })}
                                    />
                                    <Input
                                        label="Min Ratings"
                                        description="Before auto-action"
                                        type="number"
                                        size="sm"
                                        min={1}
                                        max={20}
                                        value={String(editThresholds.minRatings)}
                                        onValueChange={(v) => setEditThresholds({ ...editThresholds, minRatings: parseInt(v) || 3 })}
                                    />
                                </div>

                                {/* Validate: ban threshold must be < restrict threshold */}
                                {editThresholds.banThreshold >= editThresholds.restrictThreshold && (
                                    <p className="text-[11px] text-danger flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Ban threshold must be lower than restrict threshold
                                    </p>
                                )}

                                <Button
                                    size="sm"
                                    color="primary"
                                    className="w-full font-medium"
                                    startContent={<Save className="h-3.5 w-3.5" />}
                                    isLoading={saveThresholds.isPending}
                                    isDisabled={editThresholds.banThreshold >= editThresholds.restrictThreshold}
                                    onPress={() => saveThresholds.mutate(editThresholds)}
                                >
                                    Save Thresholds
                                </Button>
                            </CardBody>
                        </>
                    )}
                </Card>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
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
                                            className={`flex items-center gap-3 px-4 py-2.5 ${player.meritScore <= thresholds.banThreshold
                                                    ? "bg-danger/5"
                                                    : player.meritScore <= thresholds.restrictThreshold
                                                        ? "bg-warning/5"
                                                        : ""
                                                }`}
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
                                                    {player.isSoloRestricted && !player.isBanned && (
                                                        <Chip size="sm" variant="flat" color="warning" className="h-4 text-[8px]">
                                                            Solo
                                                        </Chip>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-foreground/35">
                                                    <span>{player._count.meritRatingsReceived} ratings</span>
                                                    {player.isSoloRestricted && (
                                                        <span className="flex items-center gap-0.5 text-warning">
                                                            <AlertTriangle className="h-2.5 w-2.5" />
                                                            {player.soloMatchesNeeded} matches left
                                                        </span>
                                                    )}
                                                    {player.banReason?.startsWith("Auto-") && (
                                                        <span className="text-danger">auto-banned</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={meritColor(player.meritScore, thresholds)}
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
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
