"use client";

import {
    useTournamentWinner,
} from "@/src/hooks/winner/useTournamentWinner";
import { useAppContext } from "@/src/hooks/context/useAppContext";
import { Trophy, Medal, TrendingUp } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { LoaderFive } from "@/src/components/ui/loader";
import Image from "next/image";

// Position badge component for consistent styling
function PositionBadge({
    position,
    count,
    isRefund = false
}: {
    position: number;
    count: number;
    isRefund?: boolean;
}) {
    if (count === 0) return null;

    const badges: Record<number, { icon: string; color: string; label?: string }> = {
        1: { icon: "🥇", color: "text-yellow-500" },
        2: { icon: "🥈", color: "text-gray-400" },
        3: { icon: "🥉", color: "text-orange-400" },
        4: { icon: "", color: "text-muted-foreground", label: "4th" },
        5: { icon: "", color: "text-muted-foreground", label: "5th" },
    };

    const badge = badges[position];
    if (!badge) return null;

    return (
        <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            isRefund
                ? "bg-muted/50 border border-dashed border-border"
                : "bg-muted border border-border"
        )}>
            {badge.icon ? (
                <span className="text-sm">{badge.icon}</span>
            ) : (
                <span className={cn("text-[10px] uppercase tracking-wide", badge.color)}>
                    {badge.label}
                </span>
            )}
            <span className={cn("font-bold", badge.color)}>{count}</span>
        </div>
    );
}

// Winner row component for tournament results
function WinnerRow({
    position,
    names,
    isRefund = false
}: {
    position: number;
    names: string[];
    isRefund?: boolean;
}) {
    if (!names || names.length === 0) return null;

    const positions: Record<number, { icon: string; color: string; label?: string }> = {
        1: { icon: "🥇", color: "text-yellow-500" },
        2: { icon: "🥈", color: "text-gray-400" },
        3: { icon: "🥉", color: "text-orange-400" },
        4: { icon: "", color: "text-muted-foreground", label: "4th" },
        5: { icon: "", color: "text-muted-foreground", label: "5th" },
    };

    const pos = positions[position];
    if (!pos) return null;

    return (
        <div className={cn(
            "flex items-start gap-2 py-1",
            isRefund && "opacity-70"
        )}>
            <span className="shrink-0 w-6 text-center">
                {pos.icon || (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {pos.label}
                    </span>
                )}
            </span>
            <span className={cn(
                "text-sm break-words",
                pos.color,
                isRefund && "italic"
            )}>
                {names.join(", ")}
                {isRefund && <span className="text-[10px] ml-1 opacity-60">(refund)</span>}
            </span>
        </div>
    );
}

export default function WinnersPage() {
    const { activeSeason, isLoading: isLoadingSeason } = useAppContext();
    const seasonId = activeSeason?.id || "";

    const { data, isFetching } = useTournamentWinner({ seasonId });

    // Fetch fund income data
    const { data: incomeData } = useQuery({
        queryKey: ["total-funds"],
        queryFn: async () => {
            const result = await http.get<{ totalFunds: number }>("/funds/total");
            if (result.success && result.data) {
                return { totalFunds: result.data.totalFunds };
            }
            return { totalFunds: 0 };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    const totalFunds = incomeData?.totalFunds || 0;
    const playerPlacements = data?.recentStats?.playerPlacements || [];
    const recentTournaments = data?.recentStats?.recentTournaments || [];

    // Show loading state
    if (isLoadingSeason || (seasonId && isFetching)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <LoaderFive text="Loading winners..." />
            </div>
        );
    }

    // No active season
    if (!activeSeason) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No active season found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-3 sm:p-4 max-w-3xl mx-auto">
            {/* Total Funds Display */}
            {totalFunds > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-emerald-500/10 border border-yellow-500/20">
                    <Image
                        src="/piggy-bank.svg"
                        alt="Piggy Bank"
                        width={48}
                        height={48}
                        className="drop-shadow-md"
                    />
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Bai picnic</p>
                        <p className="text-2xl font-bold text-emerald-500">₹{Number.isInteger(totalFunds) ? totalFunds : totalFunds.toFixed(2)}</p>
                    </div>
                </div>
            )}

            {/* Player Leaderboard */}
            <section className="rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm sm:text-base">Leaderboard</h2>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                Top performers in last 6 tournaments
                            </p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                    {playerPlacements.length > 0 ? (
                        playerPlacements.slice(0, 10).map((player, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/30 transition-colors"
                            >
                                {/* Rank */}
                                <div className={cn(
                                    "shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold",
                                    idx === 0 && "bg-yellow-500/20 text-yellow-500",
                                    idx === 1 && "bg-gray-400/20 text-gray-400",
                                    idx === 2 && "bg-orange-400/20 text-orange-400",
                                    idx > 2 && "bg-muted text-muted-foreground"
                                )}>
                                    {idx + 1}
                                </div>

                                {/* Player Name & Badges Container */}
                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                    {/* Player Name */}
                                    <p className="font-medium text-sm">
                                        {player.playerName}
                                    </p>

                                    {/* Position Badges */}
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <PositionBadge position={1} count={player.firstPlaceCount} />
                                        <PositionBadge position={2} count={player.secondPlaceCount} />
                                        <PositionBadge position={3} count={player.thirdPlaceCount} />
                                        <PositionBadge position={4} count={player.fourthPlaceCount} isRefund />
                                        <PositionBadge position={5} count={player.fifthPlaceCount} isRefund />
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="shrink-0 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                    {player.totalPlacements}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            No placement data yet
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Tournament Winners */}
            <section className="rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                            <Medal className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm sm:text-base">Recent Winners</h2>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                Last 6 tournaments results
                            </p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                    {recentTournaments.length > 0 ? (
                        recentTournaments.map((tournament, idx) => (
                            <div key={idx} className="px-4 py-3">
                                {/* Tournament Name */}
                                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                    {tournament.tournamentName}
                                </h3>

                                {/* Winners Grid - 2 columns on larger screens */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                    <WinnerRow position={1} names={tournament.firstPlace} />
                                    <WinnerRow position={2} names={tournament.secondPlace} />
                                    <WinnerRow position={3} names={tournament.thirdPlace} />
                                    <WinnerRow position={4} names={tournament.fourthPlace} isRefund />
                                    <WinnerRow position={5} names={tournament.fifthPlace} isRefund />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            No tournament data yet
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
