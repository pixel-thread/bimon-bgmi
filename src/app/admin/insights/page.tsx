"use client";

import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp,
    TrendingDown,
    Users,
    Coins,
    Trophy,
    AlertCircle,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";

type PlayerInsight = {
    rank: number;
    player: string;
    playerId?: string;
    tournaments: number;
    entryFees: number;
    prizes: number;
    amount: number;
    supportReceived?: { from: string; amount: number; tournament: string }[];
    totalSupport?: number;
};

type Season = {
    id: string;
    name: string;
    status: string;
};

type InsightsResponse = {
    seasons: Season[];
    selectedSeasonId: string;
    losers: PlayerInsight[];
    winners: PlayerInsight[];
    summary: {
        playersInLoss: number;
        playersInProfit: number;
        totalLosses: number;
        totalProfits: number;
    };
    keyInsight: string | null;
};

// Medal emoji based on rank
const getRankDisplay = (rank: number) => {
    switch (rank) {
        case 1:
            return "🥇";
        case 2:
            return "🥈";
        case 3:
            return "🥉";
        default:
            return rank.toString();
    }
};

export default function PlayerInsightsPage() {
    const [seasonId, setSeasonId] = useState<string>("");
    const { getToken, isSignedIn } = useAuth();
    const { user } = useAuthContext();

    const fetchWithAuth = async <T,>(url: string): Promise<T | null> => {
        const token = await getToken({ template: "jwt" });
        if (!token) return null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch");
        return response.json();
    };

    const { data, isLoading } = useQuery({
        queryKey: ["player-insights", seasonId],
        queryFn: () =>
            fetchWithAuth<InsightsResponse>(
                `/admin/analytics/player-insights${seasonId ? `?seasonId=${seasonId}` : ""}`
            ),
        enabled: isSignedIn && !!user,
    });

    // Set initial season when data loads
    useEffect(() => {
        if (data?.selectedSeasonId && !seasonId) {
            setSeasonId(data.selectedSeasonId);
        }
    }, [data?.selectedSeasonId, seasonId]);

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
                            <TrendingDown className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Player Insights</h1>
                    </div>
                    <p className="text-sm text-muted-foreground ml-13">
                        Who Lost the Most UC (Season Analysis)
                    </p>
                </div>
                <Select value={seasonId} onValueChange={setSeasonId}>
                    <SelectTrigger className="w-[200px] rounded-xl">
                        <SelectValue placeholder="Select Season" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lifetime">🌐 Lifetime</SelectItem>
                        {data?.seasons.map((season) => (
                            <SelectItem key={season.id} value={season.id}>
                                <span className="flex items-center gap-2">
                                    {season.name}
                                    {season.status === "ACTIVE" && (
                                        <span className="h-2 w-2 rounded-full bg-green-500" />
                                    )}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tables Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Biggest Losers */}
                <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-zinc-900 border border-zinc-800 shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl sm:text-2xl">💔</span>
                        <h2 className="text-lg sm:text-xl font-bold">Biggest Losers</h2>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : data?.losers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No data for this season</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-[650px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-800">
                                            <TableHead className="w-16">Rank</TableHead>
                                            <TableHead>Player</TableHead>
                                            <TableHead className="text-center">Tournaments</TableHead>
                                            <TableHead className="text-right">Entry Fees</TableHead>
                                            <TableHead className="text-right">Prizes</TableHead>
                                            <TableHead className="text-right">Loss</TableHead>
                                            <TableHead className="text-right">Support</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.losers.map((player) => (
                                            <TableRow key={player.player} className="border-zinc-800">
                                                <TableCell className="font-medium">
                                                    {getRankDisplay(player.rank)}
                                                </TableCell>
                                                <TableCell className="font-semibold">{player.player}</TableCell>
                                                <TableCell className="text-center">{player.tournaments}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(player.entryFees)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(player.prizes)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-red-500">
                                                    -{formatCurrency(player.amount)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {player.totalSupport && player.totalSupport > 0 ? (
                                                        <div className="group relative inline-block">
                                                            <span className="font-bold text-green-500 cursor-help">
                                                                +{formatCurrency(player.totalSupport)}
                                                            </span>
                                                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl text-left">
                                                                <p className="text-xs font-semibold text-zinc-400 mb-2">Support from solo winners:</p>
                                                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                                                    {player.supportReceived?.map((s, i) => (
                                                                        <div key={i} className="text-xs">
                                                                            <span className="text-green-400">₹{s.amount}</span>
                                                                            <span className="text-zinc-400"> from </span>
                                                                            <span className="text-white font-medium">{s.from}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-600">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Biggest Winners */}
                <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-zinc-900 border border-zinc-800 shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl sm:text-2xl">💰</span>
                        <h2 className="text-lg sm:text-xl font-bold">Biggest Winners</h2>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : data?.winners.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No winners this season</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-[550px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-800">
                                            <TableHead className="w-16">Rank</TableHead>
                                            <TableHead>Player</TableHead>
                                            <TableHead className="text-center">Tournaments</TableHead>
                                            <TableHead className="text-right">Entry Fees</TableHead>
                                            <TableHead className="text-right">Prizes</TableHead>
                                            <TableHead className="text-right">Profit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.winners.map((player) => (
                                            <TableRow key={player.player} className="border-zinc-800">
                                                <TableCell className="font-medium">
                                                    {getRankDisplay(player.rank)}
                                                </TableCell>
                                                <TableCell className="font-semibold">{player.player}</TableCell>
                                                <TableCell className="text-center">{player.tournaments}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(player.entryFees)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(player.prizes)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-500">
                                                    +{formatCurrency(player.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Section */}
            <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-zinc-900 border border-zinc-800 shadow-lg">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <span className="text-xl sm:text-2xl">📊</span>
                    <h2 className="text-lg sm:text-xl font-bold">Summary</h2>
                </div>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-6 w-64" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50">
                                <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Players at Loss</p>
                                    <p className="text-xl font-bold">
                                        {data?.summary.playersInLoss || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50">
                                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Players in Profit</p>
                                    <p className="text-xl font-bold">
                                        {data?.summary.playersInProfit || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50">
                                <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <Coins className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Losses</p>
                                    <p className="text-xl font-bold text-red-500">
                                        {formatCurrency(data?.summary.totalLosses || 0)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50">
                                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <Coins className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Profits</p>
                                    <p className="text-xl font-bold text-green-500">
                                        {formatCurrency(data?.summary.totalProfits || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Key Insight */}
                        {data?.keyInsight && (
                            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-amber-500">Key insight:</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {data.keyInsight}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
