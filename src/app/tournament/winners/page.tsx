"use client";

import {
    useTournamentWinner,
} from "@/src/hooks/winner/useTournamentWinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { useAppContext } from "@/src/hooks/context/useAppContext";
import { Trophy, Medal, Users, Loader2 } from "lucide-react";

export default function WinnersPage() {
    // Auto-fetch active season
    const { activeSeason, isLoading: isLoadingSeason } = useAppContext();
    const seasonId = activeSeason?.id || "";

    const { data, isFetching } = useTournamentWinner({ seasonId });

    const playerPlacements = data?.recentStats?.playerPlacements || [];
    const recentTournaments = data?.recentStats?.recentTournaments || [];

    // Show loading while fetching season or winner data
    if (isLoadingSeason || (seasonId && isFetching)) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading winners...</span>
            </div>
        );
    }

    // No active season found
    if (!activeSeason) {
        return (
            <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active season found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 max-w-7xl mx-auto">
            {/* Player Placement Stats - Last 6 Tournaments */}
            <Card className="bg-gradient-to-br from-background to-muted/30 border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        <span className="truncate">Player Placement Stats</span>
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground whitespace-nowrap">
                            (Last 6)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {playerPlacements.length > 0 ? (
                        <div className="max-h-[300px] sm:max-h-[350px] overflow-y-auto space-y-2">
                            {playerPlacements.map((player, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                                >
                                    <span className="font-medium text-sm truncate flex-1 mr-2">
                                        {player.playerName}
                                    </span>
                                    <div className="flex items-center gap-3 text-sm shrink-0">
                                        <span className="flex items-center gap-1">
                                            <span>🥇</span>
                                            <span className="font-bold text-yellow-600 dark:text-yellow-400">
                                                {player.firstPlaceCount}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span>🥈</span>
                                            <span className="font-bold text-gray-500 dark:text-gray-400">
                                                {player.secondPlaceCount}
                                            </span>
                                        </span>
                                        <span className="font-bold text-primary">
                                            = {player.totalPlacements}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">
                            No placement data available
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Recent Tournament Results */}
            <Card className="bg-gradient-to-br from-background to-muted/30 border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                        <span className="truncate">Recent Winners</span>
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground whitespace-nowrap">
                            (Last 6)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {recentTournaments.length > 0 ? (
                        <div className="max-h-[300px] sm:max-h-[350px] overflow-y-auto space-y-3">
                            {recentTournaments.map((tournament, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2"
                                >
                                    <div className="font-medium text-sm">
                                        {tournament.tournamentName}
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="shrink-0">🥇</span>
                                            <span className="text-yellow-600 dark:text-yellow-400 break-words">
                                                {tournament.firstPlace?.join(", ") || "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="shrink-0">🥈</span>
                                            <span className="text-gray-500 dark:text-gray-400 break-words">
                                                {tournament.secondPlace?.join(", ") || "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">
                            No recent tournament data available
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
