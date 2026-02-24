"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Select,
    SelectItem,
    Skeleton,
} from "@heroui/react";
import {
    AlertCircle,
    TrendingDown,
    TrendingUp,
    BarChart3,
    Info,
    Wallet,
    ArrowDownRight,
    ArrowUpRight,
    Clover,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface LoserEntry {
    rank: number;
    id: string;
    name: string;
    tournaments: number;
    entryFees: number;
    prizes: number;
    loss: number;
}

interface WinnerEntry {
    rank: number;
    id: string;
    name: string;
    tournaments: number;
    entryFees: number;
    prizes: number;
    profit: number;
}

interface InsightSummary {
    playersAtLoss: number;
    playersInProfit: number;
    totalLosses: number;
    totalProfits: number;
    totalTournaments: number;
    seasonName: string;
}

interface OrgBreakdown {
    category: string;
    total: number;
    count: number;
    players: number;
}

interface OrgEconomy {
    totalEntryFees: number;
    totalPrizes: number;
    totalOrgGiven: number;
    totalOrgShare: number;
    orgNet: number;
    breakdown: OrgBreakdown[];
}

interface LuckyVoter {
    id: string;
    name: string;
    count: number;
    tournaments: string[];
    savedUC: number;
}

interface InsightsData {
    losers: LoserEntry[];
    winners: WinnerEntry[];
    summary: InsightSummary | null;
    orgEconomy: OrgEconomy | null;
    luckyVoters: LuckyVoter[];
    keyInsight: string | null;
}

interface Season {
    id: string;
    name: string;
    status: string;
    isCurrent: boolean;
}

const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank.toString();
};

export default function PlayerInsightsPage() {
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

    // Fetch all seasons
    const { data: seasons } = useQuery<Season[]>({
        queryKey: ["seasons"],
        queryFn: async () => {
            const res = await fetch("/api/seasons");
            if (!res.ok) throw new Error("Failed to fetch seasons");
            const json = await res.json();
            return json.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    // Auto-select active season when seasons load
    const effectiveSeasonId = selectedSeasonId || seasons?.find((s) => s.isCurrent)?.id || "";

    // Fetch insights for selected season
    const { data, isLoading, error } = useQuery<InsightsData>({
        queryKey: ["player-insights", effectiveSeasonId],
        queryFn: async () => {
            const url = effectiveSeasonId
                ? `/api/dashboard/player-insights?seasonId=${effectiveSeasonId}`
                : "/api/dashboard/player-insights";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch insights");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
        enabled: !!seasons,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold">Player Insights</h1>
                    <p className="text-sm text-foreground/50">
                        Who Lost the Most UC
                        {data?.summary
                            ? ` (${data.summary.totalTournaments} Tournaments)`
                            : " (Season Analysis)"}
                    </p>
                </div>
                {/* Season Selector */}
                {seasons && seasons.length > 0 && (
                    <Select
                        label="Season"
                        selectedKeys={effectiveSeasonId ? [effectiveSeasonId] : []}
                        onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0] as string;
                            if (key) setSelectedSeasonId(key);
                        }}
                        className="w-full sm:w-48"
                        size="sm"
                        variant="bordered"
                    >
                        {seasons.map((s) => (
                            <SelectItem key={s.id} textValue={s.name}>
                                <div className="flex items-center gap-2">
                                    {s.isCurrent && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                    )}
                                    <span>{s.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </Select>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load player insights.
                </div>
            )}

            {isLoading ? (
                <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Skeleton className="h-[500px] rounded-xl" />
                        <Skeleton className="h-[500px] rounded-xl" />
                    </div>
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            ) : data ? (
                <>
                    {/* Biggest Losers & Winners — side by side */}
                    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                        {/* Biggest Losers */}
                        <motion.div
                            key={`losers-${effectiveSeasonId}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="border border-divider">
                                <CardHeader className="gap-2 pb-2">
                                    <span className="text-lg">💔</span>
                                    <h2 className="text-base font-bold">Biggest Losers</h2>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {data.losers.length === 0 ? (
                                        <p className="p-4 text-sm text-foreground/40">
                                            No losers found this season
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs sm:text-sm">
                                                <thead>
                                                    <tr className="border-b border-divider text-foreground/40">
                                                        <th className="px-1.5 py-2 text-left font-medium sm:px-3">Rank</th>
                                                        <th className="px-1.5 py-2 text-left font-medium sm:px-3">Player</th>
                                                        <th className="px-1.5 py-2 text-center font-medium sm:px-3">Played</th>
                                                        <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Entry Fees</th>
                                                        <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Prizes</th>
                                                        <th className="px-1.5 py-2 text-right font-medium sm:px-3">Loss</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.losers.map((entry) => (
                                                        <tr
                                                            key={entry.id}
                                                            className="border-b border-divider/50 transition-colors hover:bg-default-100/50"
                                                        >
                                                            <td className="px-1.5 py-2.5 text-center sm:px-3">
                                                                {rankEmoji(entry.rank)}
                                                            </td>
                                                            <td className="max-w-[100px] truncate px-1.5 py-2.5 font-medium sm:max-w-[140px] sm:px-3">
                                                                {entry.name}
                                                            </td>
                                                            <td className="px-1.5 py-2.5 text-center text-foreground/60 sm:px-3">
                                                                {entry.tournaments}
                                                            </td>
                                                            <td className="hidden px-3 py-2.5 text-right text-foreground/60 sm:table-cell">
                                                                ₹{entry.entryFees.toLocaleString()}
                                                            </td>
                                                            <td className="hidden px-3 py-2.5 text-right text-foreground/60 sm:table-cell">
                                                                ₹{entry.prizes.toLocaleString()}
                                                            </td>
                                                            <td className="px-1.5 py-2.5 text-right font-bold text-danger sm:px-3">
                                                                -₹{entry.loss.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>

                        {/* Biggest Winners */}
                        <motion.div
                            key={`winners-${effectiveSeasonId}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <Card className="border border-divider">
                                <CardHeader className="gap-2 pb-2">
                                    <span className="text-lg">💰</span>
                                    <h2 className="text-base font-bold">Biggest Winners</h2>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {data.winners.length === 0 ? (
                                        <p className="p-4 text-sm text-foreground/40">
                                            No winners found this season
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs sm:text-sm">
                                                <thead>
                                                    <tr className="border-b border-divider text-foreground/40">
                                                        <th className="px-1.5 py-2 text-left font-medium sm:px-3">Rank</th>
                                                        <th className="px-1.5 py-2 text-left font-medium sm:px-3">Player</th>
                                                        <th className="px-1.5 py-2 text-center font-medium sm:px-3">Played</th>
                                                        <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Entry Fees</th>
                                                        <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Prizes</th>
                                                        <th className="px-1.5 py-2 text-right font-medium sm:px-3">Profit</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.winners.map((entry) => (
                                                        <tr
                                                            key={entry.id}
                                                            className="border-b border-divider/50 transition-colors hover:bg-default-100/50"
                                                        >
                                                            <td className="px-1.5 py-2.5 text-center sm:px-3">
                                                                {rankEmoji(entry.rank)}
                                                            </td>
                                                            <td className="max-w-[100px] truncate px-1.5 py-2.5 font-medium sm:max-w-[140px] sm:px-3">
                                                                {entry.name}
                                                            </td>
                                                            <td className="px-1.5 py-2.5 text-center text-foreground/60 sm:px-3">
                                                                {entry.tournaments}
                                                            </td>
                                                            <td className="hidden px-3 py-2.5 text-right text-foreground/60 sm:table-cell">
                                                                ₹{entry.entryFees.toLocaleString()}
                                                            </td>
                                                            <td className="hidden px-3 py-2.5 text-right text-foreground/60 sm:table-cell">
                                                                ₹{entry.prizes.toLocaleString()}
                                                            </td>
                                                            <td className="px-1.5 py-2.5 text-right font-bold text-success sm:px-3">
                                                                +₹{entry.profit.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Summary */}
                    {data.summary && (
                        <motion.div
                            key={`summary-${effectiveSeasonId}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="border border-divider">
                                <CardHeader className="gap-2 pb-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    <h2 className="text-base font-bold">Summary</h2>
                                </CardHeader>
                                <CardBody className="space-y-4 pt-1">
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        <div className="rounded-xl bg-default-100 p-3">
                                            <div className="mb-1 flex items-center gap-1.5">
                                                <TrendingDown className="h-3.5 w-3.5 text-danger" />
                                                <span className="text-[11px] text-foreground/50">
                                                    Players at Loss
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold">
                                                {data.summary.playersAtLoss}
                                            </span>
                                        </div>
                                        <div className="rounded-xl bg-default-100 p-3">
                                            <div className="mb-1 flex items-center gap-1.5">
                                                <TrendingUp className="h-3.5 w-3.5 text-success" />
                                                <span className="text-[11px] text-foreground/50">
                                                    Players in Profit
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold">
                                                {data.summary.playersInProfit}
                                            </span>
                                        </div>
                                        <div className="rounded-xl bg-default-100 p-3">
                                            <div className="mb-1 flex items-center gap-1.5">
                                                <TrendingDown className="h-3.5 w-3.5 text-danger" />
                                                <span className="text-[11px] text-foreground/50">
                                                    Total Losses
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-danger">
                                                ₹{data.summary.totalLosses.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="rounded-xl bg-default-100 p-3">
                                            <div className="mb-1 flex items-center gap-1.5">
                                                <TrendingUp className="h-3.5 w-3.5 text-success" />
                                                <span className="text-[11px] text-foreground/50">
                                                    Total Profits
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-success">
                                                ₹{data.summary.totalProfits.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Key Insight */}
                                    {data.keyInsight && (
                                        <div className="flex gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3.5">
                                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                                            <div>
                                                <p className="text-xs font-semibold text-warning">
                                                    Key insight:
                                                </p>
                                                <p className="mt-0.5 text-sm text-foreground/70">
                                                    {data.keyInsight}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </>
            ) : null}
        </div>
    );
}
