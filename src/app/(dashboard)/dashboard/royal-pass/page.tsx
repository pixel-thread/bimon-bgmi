"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
    Skeleton,
    Avatar,
    Input,
    Button,
} from "@heroui/react";
import {
    Crown,
    Search,
    Users,
    Banknote,
    AlertCircle,
    InboxIcon,
    ArrowUpDown,
    Zap,
    Flame,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { GAME } from "@/lib/game-config";

interface RoyalPassHolder {
    id: string;
    playerId: string;
    displayName: string;
    username: string;
    imageUrl: string;
    hasRoyalPass: boolean;
    amount: number;
    displayValue: number;
    pricePaid: number;
    promoCode: string | null;
    streak: number;
    ucEarned: number;
    seasonName: string;
    createdAt: string;
}

interface NonRpStreak {
    playerId: string;
    displayName: string;
    username: string;
    imageUrl: string;
    streak: number;
    longest: number;
}

interface RoyalPassStats {
    totalPasses: number;
    ucCollected: number;
    ucRewarded: number;
    paidPurchases: number;
}

interface RoyalPassData {
    passes: RoyalPassHolder[];
    nonRpStreaks: NonRpStreak[];
    stats: RoyalPassStats;
}

export default function RoyalPassAdminPage() {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "name" | "streak">("streak");
    const [tab, setTab] = useState<"rp" | "nonrp">("rp");

    const { data, isLoading, error } = useQuery<RoyalPassData>({
        queryKey: ["admin-royal-pass"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard/royal-pass");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    const filteredPasses = useMemo(() => {
        if (!data?.passes) return [];
        let list = data.passes;

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.displayName.toLowerCase().includes(q) ||
                    p.username.toLowerCase().includes(q) ||
                    (p.promoCode && p.promoCode.toLowerCase().includes(q))
            );
        }

        if (sortBy === "name") {
            list = [...list].sort((a, b) => a.displayName.localeCompare(b.displayName));
        } else if (sortBy === "streak") {
            list = [...list].sort((a, b) => b.streak - a.streak);
        }

        return list;
    }, [data?.passes, search, sortBy]);

    const filteredNonRp = useMemo(() => {
        if (!data?.nonRpStreaks) return [];
        if (!search) return data.nonRpStreaks;
        const q = search.toLowerCase();
        return data.nonRpStreaks.filter(
            (p) =>
                p.displayName.toLowerCase().includes(q) ||
                p.username.toLowerCase().includes(q)
        );
    }, [data?.nonRpStreaks, search]);

    const cycleSortLabel = sortBy === "date" ? "Latest" : sortBy === "name" ? "A–Z" : "🔥 Streak";

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <h1 className="text-xl font-bold">{GAME.passName}</h1>
                </div>
                <p className="text-sm text-foreground/50">
                    Manage {GAME.passName} holders and track revenue
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load {GAME.passName} data.
                </div>
            )}

            {isLoading && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            )}

            {data && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { icon: <Crown className="h-5 w-5 text-yellow-500" />, value: data.stats.totalPasses, label: "Total Purchases" },
                            { icon: <Banknote className="h-5 w-5 text-success" />, value: `${data.stats.ucCollected} ${GAME.currency}`, label: `${GAME.currency} Collected` },
                            { icon: <Zap className="h-5 w-5 text-warning" />, value: `${data.stats.ucRewarded} ${GAME.currency}`, label: `${GAME.currency} Rewarded` },
                            { icon: <Users className="h-5 w-5 text-primary" />, value: data.stats.paidPurchases, label: "Paid Purchases" },
                        ].map((stat, i) => (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                                <Card className="border border-divider">
                                    <CardBody className="items-center gap-1 p-4 text-center">
                                        {stat.icon}
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-[10px] text-foreground/40">{stat.label}</p>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Tab Toggle */}
                    <div className="flex items-center gap-2 rounded-xl bg-default-100 p-1">
                        <button
                            onClick={() => setTab("rp")}
                            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === "rp"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-foreground/50 hover:text-foreground/70"
                                }`}
                        >
                            <Crown className="inline h-3.5 w-3.5 mr-1 text-yellow-500" />
                            {GAME.passName} ({data.passes.length})
                        </button>
                        <button
                            onClick={() => setTab("nonrp")}
                            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === "nonrp"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-foreground/50 hover:text-foreground/70"
                                }`}
                        >
                            <Flame className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                            Non-RP Streaks ({data.nonRpStreaks.length})
                        </button>
                    </div>

                    {/* Search + Sort */}
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search by name or username..."
                            startContent={<Search className="h-4 w-4 text-foreground/30" />}
                            value={search}
                            onValueChange={setSearch}
                            size="sm"
                            className="flex-1"
                            isClearable
                            onClear={() => setSearch("")}
                        />
                        {tab === "rp" && (
                            <Button
                                size="sm"
                                variant="flat"
                                className="h-9 min-w-0 gap-1 px-3"
                                onPress={() => setSortBy(sortBy === "date" ? "name" : sortBy === "name" ? "streak" : "date")}
                                startContent={<ArrowUpDown className="h-3.5 w-3.5" />}
                            >
                                <span className="text-xs">{cycleSortLabel}</span>
                            </Button>
                        )}
                    </div>

                    {/* RP Holders Tab */}
                    {tab === "rp" && (
                        <Card className="border border-divider">
                            <CardHeader className="justify-between pb-1">
                                <h3 className="text-sm font-semibold">
                                    All Purchases ({filteredPasses.length})
                                </h3>
                                <Chip size="sm" variant="flat" color="warning">{cycleSortLabel}</Chip>
                            </CardHeader>
                            <Divider />

                            {filteredPasses.length === 0 ? (
                                <CardBody>
                                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                                        <InboxIcon className="h-10 w-10 text-foreground/20" />
                                        <p className="text-sm text-foreground/50">
                                            {search ? "No matching holders" : `No ${GAME.passName} holders yet`}
                                        </p>
                                    </div>
                                </CardBody>
                            ) : (
                                <>
                                    {/* Desktop table header */}
                                    <div className="hidden md:grid md:grid-cols-[2fr_1fr_70px_80px_70px_70px] gap-2 px-4 py-2 text-[11px] font-medium text-foreground/40 uppercase tracking-wider border-b border-divider">
                                        <span>Player</span>
                                        <span>Purchased</span>
                                        <span className="text-center">Streak</span>
                                        <span className="text-center">{GAME.currency} Earned</span>
                                        <span className="text-center">Type</span>
                                        <span className="text-right">{GAME.currency} Paid</span>
                                    </div>

                                    <CardBody className="p-0">
                                        <div className="divide-y divide-divider">
                                            {filteredPasses.map((h, i) => (
                                                <motion.div
                                                    key={h.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.015 }}
                                                >
                                                    {/* Desktop row */}
                                                    <div className="hidden md:grid md:grid-cols-[2fr_1fr_70px_80px_70px_70px] gap-2 items-center px-4 py-2.5">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Avatar src={h.imageUrl} name={h.displayName} size="sm" className="shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium truncate">{h.displayName}</p>
                                                                <p className="text-[11px] text-foreground/40 truncate">@{h.username}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-foreground/60">
                                                            {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                        </span>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                                                            <span className="text-sm font-medium">{h.streak}</span>
                                                        </div>
                                                        <p className="text-sm text-center font-medium text-success">
                                                            {h.ucEarned > 0 ? `${h.ucEarned} ${GAME.currency}` : `0 ${GAME.currency}`}
                                                        </p>
                                                        <div className="flex justify-center">
                                                            <Chip size="sm" variant="flat" color={h.pricePaid > 0 ? "warning" : "success"}>
                                                                {h.pricePaid > 0 ? "Paid" : "🎁 Free"}
                                                            </Chip>
                                                        </div>
                                                        <p className="text-sm text-right font-semibold text-warning">
                                                            {h.amount > 0 ? `${h.amount} ${GAME.currency}` : `0 ${GAME.currency}`}
                                                        </p>
                                                    </div>

                                                    {/* Mobile row */}
                                                    <div className="flex md:hidden items-center justify-between gap-2 px-4 py-3">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <Avatar src={h.imageUrl} name={h.displayName} size="sm" className="shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="text-sm font-medium truncate">{h.displayName}</p>
                                                                    <Chip size="sm" variant="flat" color={h.pricePaid > 0 ? "warning" : "success"} className="shrink-0">
                                                                        {h.pricePaid > 0 ? `${h.amount} ${GAME.currency}` : "Free"}
                                                                    </Chip>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-foreground/40">
                                                                    <span>@{h.username}</span>
                                                                    <span className="flex items-center gap-0.5">
                                                                        <Flame className="h-2.5 w-2.5 text-orange-500" />{h.streak}
                                                                    </span>
                                                                    {h.ucEarned > 0 && (
                                                                        <span className="text-success font-medium">{h.ucEarned} {GAME.currency} earned</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </CardBody>
                                </>
                            )}
                        </Card>
                    )}

                    {/* Non-RP Streaks Tab */}
                    {tab === "nonrp" && (
                        <Card className="border border-divider">
                            <CardHeader className="justify-between pb-1">
                                <h3 className="text-sm font-semibold">
                                    Non-RP Active Streaks ({filteredNonRp.length})
                                </h3>
                                <Chip size="sm" variant="flat" color="secondary">By Streak</Chip>
                            </CardHeader>
                            <Divider />

                            {filteredNonRp.length === 0 ? (
                                <CardBody>
                                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                                        <InboxIcon className="h-10 w-10 text-foreground/20" />
                                        <p className="text-sm text-foreground/50">
                                            {search ? "No matching players" : "No non-RP players with active streaks"}
                                        </p>
                                    </div>
                                </CardBody>
                            ) : (
                                <CardBody className="p-0">
                                    <div className="divide-y divide-divider">
                                        {filteredNonRp.map((p, i) => (
                                            <motion.div
                                                key={p.playerId}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.015 }}
                                                className="flex items-center justify-between gap-2 px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <Avatar src={p.imageUrl} name={p.displayName} size="sm" className="shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{p.displayName}</p>
                                                        <p className="text-[11px] text-foreground/40">@{p.username}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="flex items-center gap-1">
                                                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                                                        <span className="text-sm font-bold">{p.streak}</span>
                                                    </div>
                                                    <Chip size="sm" variant="flat" color="default" className="text-[10px]">
                                                        Best: {p.longest}
                                                    </Chip>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardBody>
                            )}
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
